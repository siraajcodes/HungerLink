import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Smartphone, Trash2, Wifi } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  enqueueOfflineDraft,
  loadOfflineDrafts,
  removeOfflineDraft,
  syncOfflineDraftQueue,
} from '../lib/offlineQueue';
import type { DietaryPreference, IntakeChannel, OfflineRequestDraft } from '../types/database';

function toLocalDateTimeInput(offsetMinutes: number): string {
  const dt = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}

export const FieldIntakePage: React.FC = () => {
  const { organisations, createMealRequest, pushToast, t } = useApp();

  const verifiedRecipients = organisations.filter(
    (o) =>
      (o.org_type === 'VERIFIED_NGO' || o.org_type === 'COMMUNITY_KITCHEN') &&
      o.verification_status === 'verified'
  );

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [drafts, setDrafts] = useState<OfflineRequestDraft[]>(() => loadOfflineDrafts());
  const [syncing, setSyncing] = useState(false);

  const [orgId, setOrgId] = useState(verifiedRecipients[0]?.id ?? '');
  const [portionsNeeded, setPortionsNeeded] = useState('35');
  const [dietaryPref, setDietaryPref] = useState<DietaryPreference>('VEGETARIAN');
  const [urgencyScore, setUrgencyScore] = useState('0.85');
  const [intakeChannel, setIntakeChannel] = useState<IntakeChannel>('FIELD_ASSISTED_PHONE');
  const [requiredBy, setRequiredBy] = useState(() => toLocalDateTimeInput(180));
  const [notes, setNotes] = useState('');

  const effectiveOnline = isOnline && !simulateOffline;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenOrg = verifiedRecipients.find((o) => o.id === (orgId || verifiedRecipients[0]?.id));
    if (!chosenOrg) return;

    const requiredIso = new Date(requiredBy).toISOString();

    if (!effectiveOnline) {
      const queued = enqueueOfflineDraft({
        org_id: chosenOrg.id,
        org_name: chosenOrg.name,
        portions_needed: Number(portionsNeeded),
        dietary_pref: dietaryPref,
        urgency_score: Number(urgencyScore),
        intake_channel: intakeChannel,
        required_by: requiredIso,
        notes,
      });
      setDrafts(loadOfflineDrafts());
      setNotes('');
      pushToast(
        'info',
        'Saved to Offline Sync Queue',
        `Idempotency key ${queued.idempotency_key.slice(0, 8)} queued for safe synchronisation.`
      );
      return;
    }

    const res = await createMealRequest({
      org_id: chosenOrg.id,
      portions_needed: Number(portionsNeeded),
      dietary_pref: dietaryPref,
      urgency_score: Number(urgencyScore),
      intake_channel: intakeChannel,
      required_by: requiredIso,
      notes: notes.trim() || undefined,
    });
    if (!res.error) setNotes('');
  };

  const handleSyncQueue = async () => {
    if (!effectiveOnline) {
      pushToast('error', 'Device is offline', 'Reconnect before syncing pending drafts.');
      return;
    }
    setSyncing(true);
    try {
      const updated = await syncOfflineDraftQueue(drafts, async (draft) => {
        const res = await createMealRequest({
          org_id: draft.org_id,
          portions_needed: draft.portions_needed,
          dietary_pref: draft.dietary_pref,
          urgency_score: draft.urgency_score,
          intake_channel: draft.intake_channel,
          required_by: draft.required_by,
          notes: draft.notes,
          idempotency_key: draft.idempotency_key,
        });
        if (res.error) {
          return { status: 'FAILED', error: res.error };
        }
        return { status: 'SYNCED' };
      });
      setDrafts(updated);
      pushToast('success', 'Offline queue sync finished');
    } finally {
      setSyncing(false);
    }
  };

  const pendingCount = drafts.filter((d) => d.sync_status !== 'SYNCED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-display text-[#123B35]">{t.field.title}</h2>
          <p className="mt-1 text-sm text-[#64748B]">{t.field.subtitle}</p>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#123B35] cursor-pointer">
          <input
            type="checkbox"
            checked={simulateOffline}
            onChange={(e) => setSimulateOffline(e.target.checked)}
            className="accent-[#123B35]"
          />
          Test Offline Queue Mode
        </label>
      </div>

      {/* Connectivity & Non-Smartphone Inclusion Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`rounded-2xl border p-4 flex items-center gap-3 text-xs font-semibold ${
            effectiveOnline
              ? 'bg-white border-[#123B35]/15 text-[#123B35]'
              : 'bg-[#FFF9EF] border-[#FF795C] text-[#123B35]'
          }`}
        >
          {effectiveOnline ? (
            <Wifi className="w-4 h-4 text-[#16A34A] shrink-0" />
          ) : (
            <CloudOff className="w-4 h-4 text-[#FF795C] shrink-0" />
          )}
          <span>{effectiveOnline ? t.field.onlineStatus : t.field.offlineStatus}</span>
        </div>

        <div className="rounded-2xl bg-white border border-[#123B35]/15 p-4 flex items-center gap-3 text-xs text-[#64748B]">
          <Smartphone className="w-4 h-4 text-[#123B35] shrink-0" />
          <span>{t.field.noSmartphoneNotice}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Assisted Intake Form */}
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-6 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
        >
          <h3 className="text-base font-bold font-display text-[#123B35]">
            Register Assisted Meal Request
          </h3>

          <div>
            <label htmlFor="fi-org" className="block text-xs font-semibold text-[#123B35] mb-1">
              Verified Receiving Organisation *
            </label>
            <select
              id="fi-org"
              required
              value={orgId || verifiedRecipients[0]?.id || ''}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
            >
              {verifiedRecipients.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fi-channel" className="block text-xs font-semibold text-[#123B35] mb-1">
                Intake Channel *
              </label>
              <select
                id="fi-channel"
                value={intakeChannel}
                onChange={(e) => setIntakeChannel(e.target.value as IntakeChannel)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                <option value="FIELD_ASSISTED_PHONE">Phone Helpline Call</option>
                <option value="FIELD_ASSISTED_WALKIN">Walk-In Community Desk</option>
                <option value="FIELD_ASSISTED_OUTREACH">Mobile Outreach Visit</option>
              </select>
            </div>

            <div>
              <label htmlFor="fi-portions" className="block text-xs font-semibold text-[#123B35] mb-1">
                Portions Needed *
              </label>
              <input
                id="fi-portions"
                type="number"
                min={5}
                max={1000}
                required
                value={portionsNeeded}
                onChange={(e) => setPortionsNeeded(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="fi-diet" className="block text-xs font-semibold text-[#123B35] mb-1">
                Dietary Preference *
              </label>
              <select
                id="fi-diet"
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value as DietaryPreference)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
              >
                <option value="VEGETARIAN">Vegetarian</option>
                <option value="ANY">Any</option>
                <option value="VEGAN">Vegan</option>
                <option value="JAIN">Jain</option>
                <option value="HALAL">Halal</option>
              </select>
            </div>

            <div>
              <label htmlFor="fi-urgency" className="block text-xs font-semibold text-[#123B35] mb-1">
                Urgency (0.10 – 1.00)
              </label>
              <input
                id="fi-urgency"
                type="number"
                min={0.1}
                max={1}
                step={0.05}
                value={urgencyScore}
                onChange={(e) => setUrgencyScore(e.target.value)}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fi-reqby" className="block text-xs font-semibold text-[#123B35] mb-1">
              Required By *
            </label>
            <input
              id="fi-reqby"
              type="datetime-local"
              required
              value={requiredBy}
              onChange={(e) => setRequiredBy(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label htmlFor="fi-notes" className="block text-xs font-semibold text-[#123B35] mb-1">
              Non-PII Coordination Notes
            </label>
            <textarea
              id="fi-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Avoid storing personal phone/ID numbers in offline drafts."
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={verifiedRecipients.length === 0}
            className="w-full px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
          >
            {effectiveOnline ? 'Submit Assisted Request' : t.field.saveToOfflineQueue}
          </button>
        </form>

        {/* Pending Offline Draft Queue */}
        <section className="xl:col-span-6 rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#123B35]/10 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold font-display text-[#123B35]">
                {t.field.pendingQueue} ({pendingCount})
              </h3>
              <p className="text-xs text-[#64748B]">
                Local storage holds only pending drafts; Supabase remains the single system of record.
              </p>
            </div>
            <button
              type="button"
              disabled={syncing || pendingCount === 0 || !effectiveOnline}
              onClick={() => void handleSyncQueue()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D7F36B] text-[#123B35] text-xs font-bold hover:bg-[#C8E655] disabled:opacity-40 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {t.field.syncNow}
            </button>
          </div>

          {drafts.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#64748B]">
              No local offline drafts queued. Toggle &ldquo;Test Offline Queue Mode&rdquo; above to
              verify idempotent offline capture and sync.
            </div>
          ) : (
            <ul className="divide-y divide-[#123B35]/8">
              {drafts.map((draft) => (
                <li key={draft.idempotency_key} className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#123B35]">
                      {draft.org_name} · <span className="font-mono">{draft.portions_needed} portions</span>
                    </div>
                    <div className="text-xs text-[#64748B] font-mono">
                      Key: {draft.idempotency_key.slice(0, 12)}… · {draft.intake_channel} ·{' '}
                      <strong>{draft.sync_status}</strong>
                    </div>
                    {draft.last_error && (
                      <div className="text-xs text-[#FF795C] font-medium">{draft.last_error}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrafts(removeOfflineDraft(draft.idempotency_key))}
                    aria-label="Remove local draft"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#FF795C]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
