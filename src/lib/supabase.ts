import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  urlPresent: boolean;
  anonKeyPresent: boolean;
  osrmConfigured: boolean;
  osrmBaseUrl: string | null;
  safetyBufferMinutes: number;
  missingVars: string[];
}

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const rawAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
  '';
const rawOsrmUrl = (import.meta.env.VITE_OSRM_BASE_URL as string | undefined)?.trim() ?? '';
const rawBuffer = Number(import.meta.env.VITE_DELIVERY_SAFETY_BUFFER_MINUTES ?? 45);

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const supabaseConfigStatus: SupabaseConfigStatus = {
  isConfigured: isValidHttpUrl(rawUrl) && rawAnonKey.length >= 20,
  urlPresent: isValidHttpUrl(rawUrl),
  anonKeyPresent: rawAnonKey.length >= 20,
  osrmConfigured: isValidHttpUrl(rawOsrmUrl),
  osrmBaseUrl: isValidHttpUrl(rawOsrmUrl) ? rawOsrmUrl.replace(/\/+$/, '') : null,
  safetyBufferMinutes: Number.isFinite(rawBuffer) && rawBuffer >= 15 && rawBuffer <= 240 ? rawBuffer : 45,
  missingVars: [
    ...(!isValidHttpUrl(rawUrl) ? ['VITE_SUPABASE_URL'] : []),
    ...(rawAnonKey.length < 20 ? ['VITE_SUPABASE_ANON_KEY'] : []),
  ],
};

let clientInstance: SupabaseClient | null = null;

/**
 * Returns the live Supabase client connected to the shared Web + Android
 * Supabase project. Never embeds credentials or service-role keys.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseConfigStatus.isConfigured) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(rawUrl, rawAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'hungerlink-supabase-auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
}

export function getPublicAppBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_APP_PUBLIC_URL as string | undefined)?.trim();
  if (envUrl && isValidHttpUrl(envUrl)) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://hungerlink.app';
}
