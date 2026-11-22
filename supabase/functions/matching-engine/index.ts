// ==============================================================================
// HUNGERLINK 2.0 — Supabase Edge Function: Smart Surplus Matching Engine
// Formula: S = 0.35L + 0.30U + 0.20Q + 0.15T (all factors normalized 0..1)
// Deploy with: supabase functions deploy matching-engine
// ==============================================================================
// @ts-nocheck — Executed by Supabase Deno runtime

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALGORITHM_VERSION = "hungerlink-match-v2.0.0";
const DEFAULT_SAFETY_BUFFER_MINUTES = 45;
const MAX_DISTANCE_KM = 25;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isDietaryCompatible(batchType: string, requestPref: string): boolean {
  if (requestPref === "ANY") return true;
  if (requestPref === batchType) return true;
  if (requestPref === "VEGETARIAN" && (batchType === "VEGAN" || batchType === "JAIN")) return true;
  return false;
}

Deno.serve(async (req: Request) => {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
  const origin = req.headers.get("Origin") ?? "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin && origin === allowedOrigin ? origin : allowedOrigin || "https://hungerlink.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!profile || profile.role !== "ADMINISTRATOR") {
      return new Response(JSON.stringify({ error: "Forbidden: Coordinator/Administrator role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      donation_batch_id,
      safety_buffer_minutes = DEFAULT_SAFETY_BUFFER_MINUTES,
      delivery_capacity_portions = 120,
    } = body;

    if (!donation_batch_id) {
      return new Response(JSON.stringify({ error: "donation_batch_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: batch, error: batchErr } = await supabase
      .from("donation_batches")
      .select("*, donor:organisations!donor_id(*)")
      .eq("id", donation_batch_id)
      .single();

    if (batchErr || !batch) {
      return new Response(JSON.stringify({ error: "Donation batch not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: requests, error: reqErr } = await supabase
      .from("meal_requests")
      .select("*, recipient:organisations!org_id(*)")
      .in("status", ["OPEN", "PARTIALLY_ALLOCATED"])
      .eq("is_demo", batch.is_demo);

    if (reqErr) throw reqErr;

    const nowMs = Date.now();
    const pickupDeadlineMs = new Date(batch.pickup_deadline).getTime();
    const consumeByMs = new Date(batch.consume_by_time).getTime();
    const remainingAvailable = Math.max(0, batch.portions_available - batch.portions_allocated);
    const calculatedAt = new Date().toISOString();

    const rejected: Array<{ meal_request_id: string; org_name: string; reasons: string[] }> = [];
    const scored: Array<Record<string, unknown>> = [];

    for (const r of requests ?? []) {
      const reasons: string[] = [];
      const org = r.recipient;
      const needed = Math.max(0, r.portions_needed - r.portions_fulfilled);

      if (batch.donor?.verification_status !== "verified") reasons.push("Donor organisation is not verified");
      if (!org || org.verification_status !== "verified") reasons.push("Recipient organisation is not verified");
      if (batch.safety_gate_passed !== true || batch.temp_celsius === null || batch.temp_celsius === undefined) {
        reasons.push("Safety gate failed or temperature missing (fail-closed)");
      }
      if (pickupDeadlineMs <= nowMs) reasons.push("Pickup deadline has passed");
      if (!isDietaryCompatible(batch.dietary_type, r.dietary_pref)) reasons.push("Dietary requirements conflict");
      if (!org || org.daily_capacity < Math.min(needed, remainingAvailable)) {
        reasons.push("Receiving organisation has insufficient daily capacity");
      }
      if (delivery_capacity_portions <= 0) reasons.push("Available delivery capacity is insufficient");

      const distKm = org ? haversineKm(batch.pickup_lat, batch.pickup_lng, org.location_lat, org.location_lng) : 999;
      const estTransitMinutes = Math.round((distKm / 24) * 60 + 15);
      const estDeliveryMs = nowMs + estTransitMinutes * 60_000;
      const safeLatestDeliveryMs = consumeByMs - safety_buffer_minutes * 60_000;

      if (estDeliveryMs > safeLatestDeliveryMs) {
        reasons.push(`Estimated delivery (${estTransitMinutes}m) violates consume-by safety buffer (${safety_buffer_minutes}m)`);
      }

      if (reasons.length > 0) {
        rejected.push({ meal_request_id: r.id, org_name: org?.name ?? "Unknown", reasons });
        continue;
      }

      const L = Number(Math.max(0, Math.min(1, 1 - distKm / MAX_DISTANCE_KM)).toFixed(4));
      const U = Number(Math.max(0, Math.min(1, Number(r.urgency_score ?? 0.5))).toFixed(4));
      const ratio = needed > 0 && remainingAvailable > 0 ? Math.min(needed, remainingAvailable) / Math.max(needed, remainingAvailable) : 0;
      const Q = Number(Math.max(0, Math.min(1, ratio)).toFixed(4));
      const availableWindowMin = Math.max(1, (safeLatestDeliveryMs - nowMs) / 60_000);
      const T = Number(Math.max(0, Math.min(1, 1 - estTransitMinutes / (availableWindowMin + estTransitMinutes))).toFixed(4));
      const totalScore = Number((0.35 * L + 0.30 * U + 0.20 * Q + 0.15 * T).toFixed(4));

      scored.push({
        meal_request_id: r.id,
        org_id: r.org_id,
        org_name: org.name,
        portions_needed: needed,
        distance_km: Number(distKm.toFixed(2)),
        est_transit_minutes: estTransitMinutes,
        match_score: totalScore,
        match_explanation: {
          L, U, Q, T,
          total_score: totalScore,
          distance_km: Number(distKm.toFixed(2)),
          est_transit_minutes: estTransitMinutes,
          safety_buffer_minutes,
          algorithm_version: ALGORITHM_VERSION,
          calculated_at: calculatedAt,
        },
      });
    }

    scored.sort((a, b) => Number(b.match_score) - Number(a.match_score));

    // Greedy split-batch allocation bounded by available portions & delivery capacity
    let pool = Math.min(remainingAvailable, delivery_capacity_portions);
    const proposals = [];
    for (const cand of scored) {
      if (pool <= 0) break;
      const alloc = Math.min(pool, Number(cand.portions_needed));
      if (alloc > 0) {
        proposals.push({ ...cand, allocated_portions: alloc });
        pool -= alloc;
      }
    }

    return new Response(
      JSON.stringify({
        algorithm_version: ALGORITHM_VERSION,
        calculated_at: calculatedAt,
        portions_available: remainingAvailable,
        remaining_unallocated: Math.max(0, remainingAvailable - proposals.reduce((s, p) => s + p.allocated_portions, 0)),
        proposals,
        rejected_candidates: rejected,
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
