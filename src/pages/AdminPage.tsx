import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import type { IncidentStatus, IncidentType, Organisation, VerificationStatus } from '../types/database';

export const AdminPage: React.FC = () => {
  const {
    profile,
    organisations,
    batches,
    incidents,
    auditLogs,
    updateOrganisationStatus,
    reportIncident,
    updateIncidentStatus,
  } = useApp();

  const [pendingOrgAction, setPendingOrgAction] = useState<{
    org: Organisation;
    nextStatus: VerificationStatus;
  } | null>(null);

  const [incBatchId, setIncBatchId] = useState(batches[0]?.id ?? '');
  const [incType, setIncType] = useState<IncidentType>('TEMP_DEVIATION');
  const [incDesc, setIncDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (profile?.role !== 'ADMINISTRATOR') {
    return (
      <div className="rounded-2xl bg-white border border-[#FF795C] p-8 max-w-xl">
        <h2 className="text-lg font-bold font-display text-[#123B35]">
          Administrator Authorisation Required
        </h2>
        <p className="mt-2 text-sm text-[#64748B]">
          Administrative governance controls are restricted to verified administrators and enforced
          by PostgreSQL Row Level Security policies.
        </p>
      </div>
    );
  }

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await reportIncident({
      batch_id: incBatchId || null,
      incident_type: incType,
      description: incDesc,
    });
    if (res.error) setErrorMsg(res.error);
    else setIncDesc('');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          Administrative Governance &amp; Audit Console
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Verify or suspend organisations, manage food-safety incidents, and inspect the immutable
          audit log. Every sensitive action records actor identity, timestamp, and reason.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
          {errorMsg}
        </div>
      )}

      {/* Organisation Verification Queue */}
      <section className="rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#123B35]/10">
          <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Organisation Verification &amp; Status Review ({organisations.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                <th className="py-3 px-6">Organisation</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4">Verification Doc</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#123B35]/8 text-sm">
              {organisations.map((org) => (
                <tr key={org.id} className="hover:bg-[#FFF9EF]/40">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-[#123B35]">{org.name}</div>
                    <div className="text-xs text-[#64748B]">
                      {org.org_type.replace(/_/g, ' ')} · {org.contact_person} ({org.contact_phone})
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-[#64748B]">
                    <div>{org.fssai_reg_no ? `FSSAI: ${org.fssai_reg_no}` : '—'}</div>
                    <div>{org.ngo_reg_no ? `NGO: ${org.ngo_reg_no}` : ''}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-[#64748B]">
                    {org.verification_doc_path ? 'Private doc stored' : 'Not uploaded'}
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <div className="font-bold text-[#123B35]">{org.verification_status}</div>
                    {org.verification_reason && (
                      <div className="mt-0.5 text-[#64748B] max-w-xs">{org.verification_reason}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      {org.verification_status !== 'verified' && (
                        <button
                          type="button"
                          onClick={() => setPendingOrgAction({ org, nextStatus: 'verified' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify
                        </button>
                      )}
                      {org.verification_status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => setPendingOrgAction({ org, nextStatus: 'suspended' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#FF795C] text-[#FF795C] text-xs font-semibold hover:bg-[#FF795C]/10"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Suspend
                        </button>
                      )}
                      {org.verification_status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setPendingOrgAction({ org, nextStatus: 'rejected' })}
                          className="px-2.5 py-1.5 rounded-lg border border-[#123B35]/20 text-[#64748B] text-xs font-semibold hover:text-[#123B35]"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Incident Management & Immutable Audit Log */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-6 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-5">
          <h3 className="text-base font-bold font-display text-[#123B35] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FF795C]" />
            Incident Management ({incidents.length})
          </h3>

          <form onSubmit={handleReportIncident} className="space-y-3 rounded-xl bg-[#FFF9EF] p-4 border border-[#123B35]/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="inc-batch" className="block text-xs font-semibold text-[#123B35] mb-1">
                  Related Batch
                </label>
                <select
                  id="inc-batch"
                  value={incBatchId}
                  onChange={(e) => setIncBatchId(e.target.value)}
                  className="w-full rounded-lg border border-[#123B35]/20 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="">General Operational Incident</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_code} — {b.food_item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inc-type" className="block text-xs font-semibold text-[#123B35] mb-1">
                  Incident Type
                </label>
                <select
                  id="inc-type"
                  value={incType}
                  onChange={(e) => setIncType(e.target.value as IncidentType)}
                  className="w-full rounded-lg border border-[#123B35]/20 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="TEMP_DEVIATION">Temperature Deviation</option>
                  <option value="PACKAGING_DAMAGE">Packaging Damage</option>
                  <option value="DELIVERY_DELAY">Delivery Delay</option>
                  <option value="QUANTITY_DISCREPANCY">Quantity Discrepancy</option>
                  <option value="SAFETY_CONCERN">Food Safety Concern</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <textarea
              required
              rows={2}
              value={incDesc}
              onChange={(e) => setIncDesc(e.target.value)}
              placeholder="Document observed incident details..."
              className="w-full rounded-lg border border-[#123B35]/20 bg-white px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
            >
              Log Incident
            </button>
          </form>

          {incidents.length === 0 ? (
            <p className="text-xs text-[#64748B]">No open or historical incidents recorded.</p>
          ) : (
            <ul className="divide-y divide-[#123B35]/8">
              {incidents.map((inc) => (
                <li key={inc.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#123B35]">{inc.incident_type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-[#64748B]">{inc.status}</span>
                  </div>
                  <p className="text-xs text-[#64748B]">{inc.description}</p>
                  {inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && (
                    <div className="flex items-center gap-2">
                      {(['INVESTIGATING', 'RESOLVED'] as IncidentStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            void updateIncidentStatus(inc.id, st, `Updated to ${st} by coordinator`)
                          }
                          className="px-2.5 py-1 rounded-md border border-[#123B35]/20 text-[11px] font-semibold text-[#123B35] hover:bg-[#FFF9EF]"
                        >
                          Mark {st}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Immutable Audit Log */}
        <section className="xl:col-span-6 rounded-2xl bg-white border border-[#123B35]/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#123B35]/10">
            <h3 className="text-base font-bold font-display text-[#123B35]">
              Append-Only Audit Log ({auditLogs.length})
            </h3>
            <p className="text-xs text-[#64748B]">
              Protected against UPDATE and DELETE by PostgreSQL triggers.
            </p>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">No audit entries yet.</div>
          ) : (
            <ul className="divide-y divide-[#123B35]/8 max-h-[460px] overflow-y-auto">
              {auditLogs.map((log) => (
                <li key={log.id} className="px-6 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-[#123B35]">{log.action}</span>
                    <span className="text-[11px] font-mono tabular-nums text-[#64748B]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B]">
                    {log.actor_label ?? log.actor_id?.slice(0, 8) ?? 'System'} · {log.entity_type}
                  </div>
                  {Object.keys(log.metadata ?? {}).length > 0 && (
                    <div className="font-mono text-[11px] text-[#64748B] truncate">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingOrgAction)}
        title={`Set ${pendingOrgAction?.org.name ?? ''} to ${pendingOrgAction?.nextStatus ?? ''}`}
        description="Changing organisation verification status controls whether the organisation can participate in live surplus food allocation. An audit reason is mandatory."
        confirmLabel={`Confirm ${pendingOrgAction?.nextStatus ?? ''}`}
        destructive={pendingOrgAction?.nextStatus === 'suspended' || pendingOrgAction?.nextStatus === 'rejected'}
        requireReason
        reasonLabel="Verification / Suspension Audit Reason"
        onCancel={() => setPendingOrgAction(null)}
        onConfirm={async (reason) => {
          if (!pendingOrgAction) return;
          const res = await updateOrganisationStatus(
            pendingOrgAction.org.id,
            pendingOrgAction.nextStatus,
            reason
          );
          if (res.error) setErrorMsg(res.error);
          setPendingOrgAction(null);
        }}
      />
    </div>
  );
};
