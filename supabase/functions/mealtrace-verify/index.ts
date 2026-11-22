// ==============================================================================
// HUNGERLINK 2.0 — Supabase Edge Function: MealTrace Opaque QR Verification
// Returns ONLY safe non-PII traceability data for public callers; never exposes
// private recipient contact details or residential addresses.
// Deploy with: supabase functions deploy mealtrace-verify
// ==============================================================================
// @ts-nocheck — Executed by Supabase Deno runtime

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Simple in-memory per-isolate sliding window rate limiter
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(clientKey);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(clientKey, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= MAX_REQUESTS_PER_MINUTE) return false;
  bucket.count += 1;
  return true;
}

Deno.serve(async (req: Request) => {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
  const origin = req.headers.get("Origin") ?? "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin && origin === allowedOrigin ? origin : allowedOrigin || "https://hungerlink.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token || token.length < 16 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
      return new Response(JSON.stringify({ error: "Invalid MealTrace tracking token format." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role key is used strictly inside this trusted Edge Function to return
    // a sanitized, non-PII traceability projection for opaque token holders.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: batch, error: batchErr } = await supabase
      .from("donation_batches")
      .select("id, batch_code, food_item, dietary_type, portions_available, portions_allocated, prep_time, consume_by_time, safety_gate_passed, status, is_demo")
      .eq("qr_token", token)
      .single();

    if (batchErr || !batch) {
      return new Response(JSON.stringify({ error: "Batch traceability record not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: events } = await supabase
      .from("mealtrace_events")
      .select("id, event_type, recorded_temp, confirmed_portions, created_at")
      .eq("donation_batch_id", batch.id)
      .order("created_at", { ascending: true });

    return new Response(
      JSON.stringify({
        disclaimer: "MealTrace provides chain-of-custody traceability and does not replace physical food-safety inspection.",
        batch: {
          batch_code: batch.batch_code,
          food_item: batch.food_item,
          dietary_type: batch.dietary_type,
          portions_available: batch.portions_available,
          portions_allocated: batch.portions_allocated,
          prep_time: batch.prep_time,
          consume_by_time: batch.consume_by_time,
          safety_gate_passed: batch.safety_gate_passed,
          status: batch.status,
          is_demo: batch.is_demo,
        },
        events: events ?? [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
