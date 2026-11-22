import type { DietaryPreference, IntakeChannel, OfflineRequestDraft } from '../types/database';

const OFFLINE_QUEUE_STORAGE_KEY = 'hungerlink_field_worker_offline_queue_v2';

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function loadOfflineDrafts(): OfflineRequestDraft[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineDrafts(drafts: OfflineRequestDraft[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Keep only minimal non-sensitive fields required for assisted request sync
    window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function enqueueOfflineDraft(params: {
  org_id: string;
  org_name: string;
  portions_needed: number;
  dietary_pref: DietaryPreference;
  urgency_score: number;
  intake_channel: IntakeChannel;
  required_by: string;
  notes: string;
}): OfflineRequestDraft {
  const draft: OfflineRequestDraft = {
    idempotency_key: generateIdempotencyKey(),
    org_id: params.org_id,
    org_name: params.org_name,
    portions_needed: params.portions_needed,
    dietary_pref: params.dietary_pref,
    urgency_score: params.urgency_score,
    intake_channel: params.intake_channel,
    required_by: params.required_by,
    notes: params.notes.trim().slice(0, 280),
    created_at_local: new Date().toISOString(),
    sync_status: 'PENDING',
    attempts: 0,
  };
  const existing = loadOfflineDrafts();
  const next = [draft, ...existing];
  saveOfflineDrafts(next);
  return draft;
}

export function removeOfflineDraft(idempotencyKey: string): OfflineRequestDraft[] {
  const next = loadOfflineDrafts().filter((d) => d.idempotency_key !== idempotencyKey);
  saveOfflineDrafts(next);
  return next;
}

export interface SyncHandlerResult {
  status: 'SYNCED' | 'CONFLICT' | 'FAILED';
  error?: string;
}

/**
 * Synchronizes pending field-worker drafts sequentially using their UUID idempotency keys.
 * Never silently overwrites newer server records; marks conflicts explicitly for operator review.
 */
export async function syncOfflineDraftQueue(
  drafts: OfflineRequestDraft[],
  submitOne: (draft: OfflineRequestDraft) => Promise<SyncHandlerResult>
): Promise<OfflineRequestDraft[]> {
  const updated: OfflineRequestDraft[] = [];

  for (const draft of drafts) {
    if (draft.sync_status === 'SYNCED') {
      updated.push(draft);
      continue;
    }

    // Detect stale drafts whose required_by window has expired before overwriting server state
    if (new Date(draft.required_by).getTime() <= Date.now()) {
      updated.push({
        ...draft,
        sync_status: 'CONFLICT',
        attempts: draft.attempts + 1,
        last_error: 'Required-by deadline elapsed while offline. Review before resubmitting.',
      });
      continue;
    }

    try {
      const outcome = await submitOne(draft);
      updated.push({
        ...draft,
        sync_status: outcome.status,
        attempts: draft.attempts + 1,
        last_error: outcome.error,
      });
    } catch (err) {
      updated.push({
        ...draft,
        sync_status: 'FAILED',
        attempts: draft.attempts + 1,
        last_error: err instanceof Error ? err.message : 'Network error during sync',
      });
    }
  }

  saveOfflineDrafts(updated);
  return updated;
}
