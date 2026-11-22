import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';
import {
  formatFoodName,
  formatIncidentStatus,
  formatIncidentType,
  formatOrgName,
  formatOrgType,
  formatVerificationStatus,
  tx,
} from '../i18n/helpers';
import { canPerformAction } from '../lib/rbac';
import type { IncidentStatus, IncidentType, Organisation, VerificationStatus } from '../types/database';

export const AdminPage: React.FC = () => {
  const {
    language,
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

  const canVerifyOrg = canPerformAction(profile?.role, 'admin:verify_org');
  const canManageIncidents = canPerformAction(profile?.role, 'admin:manage_incidents');

  if (!canVerifyOrg) {
    return (
      <div className="rounded-2xl bg-white border border-[#FF795C] p-8 max-w-xl">
        <h2 className="text-lg font-bold font-display text-[#123B35]">
          {tx(language, 'Administrator Authorisation Required', 'நிர்வாகி அனுமதி தேவை')}
        </h2>
        <p className="mt-2 text-sm text-[#64748B]">
          {tx(
            language,
            'Administrative governance controls are restricted to verified administrators and enforced by PostgreSQL Row Level Security policies.',
            'நிர்வாகக் கட்டுப்பாடுகள் சரிபார்க்கப்பட்ட நிர்வாகிகளுக்கு மட்டுமே அனுமதிக்கப்பட்டுள்ளன; இவை PostgreSQL Row Level Security கொள்கைகளால் பாதுகாக்கப்படுகின்றன.'
          )}
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
          {tx(language, 'Administrative Governance & Audit Console', 'நிர்வாகம் & தணிக்கைப் பலகம்')}
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {tx(
            language,
            'Verify or suspend organisations, manage food-safety incidents, and inspect the immutable audit log. Every sensitive action records actor identity, timestamp, and reason.',
            'நிறுவனங்களைச் சரிபார்க்கவும் அல்லது இடைநிறுத்தவும், உணவுப் பாதுகாப்புச் சிக்கல்களை நிர்வகிக்கவும், மாற்ற முடியாத தணிக்கைப் பதிவைப் பார்வையிடவும். ஒவ்வொரு முக்கியச் செயலும் செய்தவர், நேரம் மற்றும் காரணத்தைப் பதிவுசெய்கிறது.'
          )}
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
            {tx(
              language,
              `Organisation Verification & Status Review (${organisations.length})`,
              `நிறுவன சரிபார்ப்பு & நிலை ஆய்வு (${organisations.length})`
            )}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#123B35]/10 bg-[#FFF9EF]/60 text-xs font-semibold text-[#64748B]">
                <th className="py-3 px-6">{tx(language, 'Organisation', 'நிறுவனம்')}</th>
                <th className="py-3 px-4">{tx(language, 'Registrations', 'பதிவு எண்கள்')}</th>
                <th className="py-3 px-4">{tx(language, 'Verification Doc', 'சரிபார்ப்பு ஆவணம்')}</th>
                <th className="py-3 px-4">{tx(language, 'Status', 'நிலை')}</th>
                <th className="py-3 px-6 text-right">{tx(language, 'Governance Actions', 'நிர்வாக நடவடிக்கைகள்')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#123B35]/8 text-sm">
              {organisations.map((org) => (
                <tr key={org.id} className="hover:bg-[#FFF9EF]/40">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-[#123B35]">{formatOrgName(org.name, language)}</div>
                    <div className="text-xs text-[#64748B]">
                      {formatOrgType(org.org_type, language)} · {org.contact_person} ({org.contact_phone})
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-[#64748B]">
                    <div>{org.fssai_reg_no ? `FSSAI: ${org.fssai_reg_no}` : '—'}</div>
                    <div>{org.ngo_reg_no ? `NGO: ${org.ngo_reg_no}` : ''}</div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-[#64748B]">
                    {org.verification_doc_path
                      ? tx(language, 'Private doc stored', 'தனிப்பட்ட ஆவணம் சேமிக்கப்பட்டது')
                      : tx(language, 'Not uploaded', 'பதிவேற்றப்படவில்லை')}
                  </td>
                  <td className="py-4 px-4 text-xs">
                    <div className="font-bold text-[#123B35]">
                      {formatVerificationStatus(org.verification_status, language)}
                    </div>
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
                          {tx(language, 'Verify', 'சரிபார்')}
                        </button>
                      )}
                      {org.verification_status !== 'suspended' && (
                        <button
                          type="button"
                          onClick={() => setPendingOrgAction({ org, nextStatus: 'suspended' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#FF795C] text-[#FF795C] text-xs font-semibold hover:bg-[#FF795C]/10"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {tx(language, 'Suspend', 'இடைநிறுத்து')}
                        </button>
                      )}
                      {org.verification_status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => setPendingOrgAction({ org, nextStatus: 'rejected' })}
                          className="px-2.5 py-1.5 rounded-lg border border-[#123B35]/20 text-[#64748B] text-xs font-semibold hover:text-[#123B35]"
                        >
                          {tx(language, 'Reject', 'நிராகரி')}
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
            {tx(language, `Incident Management (${incidents.length})`, `சிக்கல் மேலாண்மை (${incidents.length})`)}
          </h3>

          {canManageIncidents && (
            <form onSubmit={handleReportIncident} className="space-y-3 rounded-xl bg-[#FFF9EF] p-4 border border-[#123B35]/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inc-batch" className="block text-xs font-semibold text-[#123B35] mb-1">
                    {tx(language, 'Related Batch', 'தொடர்புடைய தொகுதி')}
                  </label>
                  <select
                    id="inc-batch"
                    value={incBatchId}
                    onChange={(e) => setIncBatchId(e.target.value)}
                    className="w-full rounded-lg border border-[#123B35]/20 bg-white px-2.5 py-1.5 text-xs"
                  >
                    <option value="">{tx(language, 'General Operational Incident', 'பொது செயல்பாட்டுச் சிக்கல்')}</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batch_code} — {formatFoodName(b.food_item, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inc-type" className="block text-xs font-semibold text-[#123B35] mb-1">
                    {tx(language, 'Incident Type', 'சிக்கல் வகை')}
                  </label>
                  <select
                    id="inc-type"
                    value={incType}
                    onChange={(e) => setIncType(e.target.value as IncidentType)}
                    className="w-full rounded-lg border border-[#123B35]/20 bg-white px-2.5 py-1.5 text-xs"
                  >
                    {(['TEMP_DEVIATION', 'PACKAGING_DAMAGE', 'DELIVERY_DELAY', 'QUANTITY_DISCREPANCY', 'SAFETY_CONCERN', 'OTHER'] as IncidentType[]).map(
                      (tKey) => (
                        <option key={tKey} value={tKey}>
                          {formatIncidentType(tKey, language)}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
              <textarea
                required
                rows={2}
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                placeholder={tx(language, 'Document observed incident details...', 'கவனிக்கப்பட்ட சிக்கலின் விவரங்களைப் பதிவுசெய்யவும்...')}
                className="w-full rounded-lg border border-[#123B35]/20 bg-white px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
              >
                {tx(language, 'Log Incident', 'சிக்கலைப் பதிவுசெய்')}
              </button>
            </form>
          )}

          {incidents.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              {tx(language, 'No open or historical incidents recorded.', 'திறந்த அல்லது பழைய சிக்கல்கள் எதுவும் பதிவாகவில்லை.')}
            </p>
          ) : (
            <ul className="divide-y divide-[#123B35]/8">
              {incidents.map((inc) => (
                <li key={inc.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#123B35]">{formatIncidentType(inc.incident_type, language)}</span>
                    <span className="font-mono text-[#64748B]">{formatIncidentStatus(inc.status, language)}</span>
                  </div>
                  <p className="text-xs text-[#64748B]">{inc.description}</p>
                  {canManageIncidents && inc.status !== 'RESOLVED' && inc.status !== 'CLOSED' && (
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
                          {tx(
                            language,
                            `Mark ${formatIncidentStatus(st, 'en')}`,
                            `${formatIncidentStatus(st, 'ta')} எனக் குறி`
                          )}
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
              {tx(language, `Append-Only Audit Log (${auditLogs.length})`, `மாற்ற முடியாத தணிக்கைப் பதிவு (${auditLogs.length})`)}
            </h3>
            <p className="text-xs text-[#64748B]">
              {tx(
                language,
                'Protected against UPDATE and DELETE by PostgreSQL triggers.',
                'PostgreSQL தூண்டிகளால் திருத்தம் மற்றும் நீக்கத்திலிருந்து பாதுகாக்கப்பட்டது.'
              )}
            </p>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B]">
              {tx(language, 'No audit entries yet.', 'இன்னும் தணிக்கைப் பதிவுகள் இல்லை.')}
            </div>
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
                    {log.actor_label ?? log.actor_id?.slice(0, 8) ?? tx(language, 'System', 'அமைப்பு')} · {log.entity_type}
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
        title={tx(
          language,
          `Set ${pendingOrgAction?.org.name ?? ''} to ${pendingOrgAction?.nextStatus ?? ''}`,
          `${formatOrgName(pendingOrgAction?.org.name, language)} நிலையை "${formatVerificationStatus(pendingOrgAction?.nextStatus ?? '', language)}" என மாற்று`
        )}
        description={tx(
          language,
          'Changing organisation verification status controls whether the organisation can participate in live surplus food allocation. An audit reason is mandatory.',
          'நிறுவனத்தின் சரிபார்ப்பு நிலையை மாற்றுவது, அந்த நிறுவனம் நேரடி உணவுப் பகிர்வில் பங்கேற்கலாமா என்பதைக் கட்டுப்படுத்தும். தணிக்கைக் காரணம் கட்டாயம்.'
        )}
        confirmLabel={tx(
          language,
          `Confirm ${pendingOrgAction?.nextStatus ?? ''}`,
          `${formatVerificationStatus(pendingOrgAction?.nextStatus ?? '', language)} — உறுதிசெய்`
        )}
        destructive={pendingOrgAction?.nextStatus === 'suspended' || pendingOrgAction?.nextStatus === 'rejected'}
        requireReason
        reasonLabel={tx(language, 'Verification / Suspension Audit Reason', 'சரிபார்ப்பு / இடைநிறுத்த தணிக்கைக் காரணம்')}
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
