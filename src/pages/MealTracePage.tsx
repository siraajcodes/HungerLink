import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle2, ExternalLink, QrCode, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatBatchStatus,
  formatDietary,
  formatFoodName,
  formatMealTraceEvent,
  tx,
} from '../i18n/helpers';
import { LANGUAGE_OPTIONS } from '../i18n/translations';
import { getAllowedScanEvents, type ScannableMealTraceEvent } from '../lib/rbac';
import { getPublicAppBaseUrl } from '../lib/supabase';

export const MealTracePage: React.FC<{ publicView?: boolean }> = ({ publicView = false }) => {
  const { token: paramToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const initialToken = paramToken || searchParams.get('token') || '';

  const { batches, mealtraceEvents, recordMealTraceScan, profile, language, setLanguage, t } = useApp();

  const allowedScanEvents = useMemo(() => getAllowedScanEvents(profile?.role), [profile?.role]);
  const canRecordAnyScan = !publicView && Boolean(profile) && allowedScanEvents.length > 0;

  const [activeToken, setActiveToken] = useState(
    initialToken || batches.find((b) => b.safety_gate_passed)?.qr_token || batches[0]?.qr_token || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scanEventType, setScanEventType] = useState<ScannableMealTraceEvent>(
    allowedScanEvents[0] ?? 'PICKUP_SCANNED'
  );
  const [recordedTemp, setRecordedTemp] = useState('62.5');
  const [confirmedPortions, setConfirmedPortions] = useState('60');
  const [distributionArea, setDistributionArea] = useState('Adyar & Velachery Community Sites');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (allowedScanEvents.length > 0 && !allowedScanEvents.includes(scanEventType)) {
      setScanEventType(allowedScanEvents[0]);
    }
  }, [allowedScanEvents, scanEventType]);

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const activeBatch = useMemo(
    () => batches.find((b) => b.qr_token === activeToken.trim()),
    [batches, activeToken]
  );

  const batchEvents = useMemo(
    () =>
      activeBatch
        ? mealtraceEvents.filter((e) => e.donation_batch_id === activeBatch.id)
        : [],
    [mealtraceEvents, activeBatch]
  );

  useEffect(() => {
    if (!activeBatch?.qr_token) {
      setQrDataUrl('');
      return;
    }
    const trackingUrl = `${getPublicAppBaseUrl()}/track/${encodeURIComponent(activeBatch.qr_token)}`;
    QRCode.toDataURL(trackingUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#123B35', light: '#FFFFFF' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [activeBatch?.qr_token]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const extractTokenFromQrPayload = (raw: string): string => {
    try {
      const parsed = new URL(raw);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const trackIdx = parts.indexOf('track');
      if (trackIdx >= 0 && parts[trackIdx + 1]) return decodeURIComponent(parts[trackIdx + 1]);
    } catch {
      // Raw opaque token directly
    }
    return raw.trim();
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        tx(
          language,
          'Browser camera access is unavailable. Enter the QR token manually.',
          'உலாவி கேமரா அணுகல் இல்லை. QR குறியீட்டை நேரடியாக உள்ளிடவும்.'
        )
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError(
        tx(
          language,
          'Camera permission denied or no camera device detected.',
          'கேமரா அனுமதி மறுக்கப்பட்டது அல்லது கேமரா கண்டறியப்படவில்லை.'
        )
      );
    }
  };

  useEffect(() => {
    if (!cameraActive) return;
    let rafId = 0;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);
          if (decoded?.data) {
            setActiveToken(extractTokenFromQrPayload(decoded.data));
            stopCamera();
            return;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cameraActive]);

  const handleRecordScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!activeBatch || !canRecordAnyScan) {
      setErrorMsg(
        tx(
          language,
          'Resolve a valid MealTrace QR token before recording an event.',
          'நிகழ்வைப் பதிவு செய்வதற்கு முன் சரியான QR குறியீட்டைத் தேர்ந்தெடுக்கவும்.'
        )
      );
      return;
    }
    const res = await recordMealTraceScan({
      qr_token: activeBatch.qr_token,
      event_type: scanEventType,
      recorded_temp: recordedTemp.trim() ? Number(recordedTemp) : null,
      confirmed_portions:
        scanEventType === 'PORTIONS_CONFIRMED' ? Number(confirmedPortions) : null,
      distribution_area: scanEventType === 'PORTIONS_CONFIRMED' ? distributionArea.trim() : undefined,
      notes: notes.trim(),
    });
    if (res.error) setErrorMsg(res.error);
    else setNotes('');
  };

  const scanEventOptionLabel = (ev: ScannableMealTraceEvent): string => {
    if (ev === 'PICKUP_SCANNED') {
      return tx(language, 'Delivery Partner: Pickup Scanned', 'விநியோகப் பங்குதாரர்: சேகரிப்பு ஸ்கேன்');
    }
    if (ev === 'HANDOVER_SCANNED') {
      return tx(language, 'Handover Scanned at Destination', 'இலக்கில் ஒப்படைப்பு ஸ்கேன்');
    }
    return tx(
      language,
      'Receiving Org: Confirm Actual Portions (Updates Impact)',
      'பெறும் நிறுவனம்: பெறப்பட்ட பங்குகளை உறுதிப்படுத்து'
    );
  };

  return (
    <div className={publicView ? 'min-h-screen bg-[#FFF9EF] p-6 sm:p-10 max-w-4xl mx-auto space-y-6' : 'space-y-6'}>
      {publicView && (
        <div className="flex items-center justify-between border-b border-[#123B35]/10 pb-4 gap-3">
          <span className="text-lg font-extrabold font-display text-[#123B35]">
            {t.brand} · {tx(language, 'Public Meal Verification', 'பொது உணவு சரிபார்ப்பு')}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-[#123B35]/15">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                    language === opt.code
                      ? 'bg-[#123B35] text-white'
                      : 'text-[#64748B] hover:text-[#123B35]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Link to="/" className="text-xs font-semibold text-[#123B35] underline">
              {tx(language, 'Open Platform', 'தளத்தைத் திற')}
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          {tx(language, 'MealTrace QR Tracking', 'உணவு QR கண்காணிப்பு')}
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {tx(
            language,
            'Scan or verify food handover QR codes. Personal details are never stored inside QR codes.',
            'உணவு ஒப்படைப்பு QR குறியீடுகளை ஸ்கேன் செய்து சரிபார்க்கவும். தனிப்பட்ட தகவல்கள் QR-இல் சேமிக்கப்படுவதில்லை.'
          )}
        </p>
      </div>

      {/* Traceability vs Food Safety Notice */}
      <div className="rounded-2xl bg-white border border-[#123B35]/15 p-4 text-xs text-[#64748B] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#123B35] shrink-0 mt-0.5" />
        <span>
          {tx(
            language,
            'QR tracking confirms delivery and handover steps. It does not replace physical food-safety inspection.',
            'QR கண்காணிப்பு விநியோகம் மற்றும் ஒப்படைப்பு நிலைகளை உறுதிப்படுத்தும்; இது நேரடி உணவுப் பாதுகாப்பு ஆய்வுக்கு மாற்றல்ல.'
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: QR Code Card + Browser Camera Scanner */}
        <section className="xl:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-[#123B35] flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                {tx(language, 'Batch Tracking Token', 'தொகுதி கண்காணிப்பு குறியீடு')}
              </h3>
              {!publicView && (
                <button
                  type="button"
                  onClick={() => (cameraActive ? stopCamera() : void startCameraScanner())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                >
                  {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  {cameraActive
                    ? tx(language, 'Stop Camera', 'கேமராவை நிறுத்து')
                    : tx(language, 'Scan with Camera', 'கேமராவில் ஸ்கேன் செய்')}
                </button>
              )}
            </div>

            {cameraError && (
              <div className="rounded-xl bg-[#FF795C]/10 border border-[#FF795C] px-3 py-2 text-xs text-[#123B35]">
                {cameraError}
              </div>
            )}

            {cameraActive && (
              <div className="rounded-xl overflow-hidden border border-[#123B35]/20 bg-black">
                <video ref={videoRef} className="w-full h-56 object-cover" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {!publicView && batches.length > 0 && (
              <div>
                <label htmlFor="mt-select" className="block text-xs font-semibold text-[#123B35] mb-1">
                  {tx(language, 'Select Food Batch', 'உணவுத் தொகுதியைத் தேர்ந்தெடு')}
                </label>
                <select
                  id="mt-select"
                  value={activeToken}
                  onChange={(e) => setActiveToken(e.target.value)}
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.qr_token}>
                      {b.batch_code} — {formatFoodName(b.food_item, language)} ({formatBatchStatus(b.status, language)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="mt-token" className="block text-xs font-semibold text-[#123B35] mb-1">
                {tx(language, 'Opaque QR Token', 'QR குறியீடு')}
              </label>
              <input
                id="mt-token"
                type="text"
                value={activeToken}
                onChange={(e) => setActiveToken(e.target.value)}
                placeholder={tx(language, 'Paste MealTrace QR token...', 'QR குறியீட்டை இங்கே ஒட்டவும்...')}
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono"
              />
            </div>

            {activeBatch && qrDataUrl && (
              <div className="pt-2 flex flex-col items-center text-center space-y-2">
                <img
                  src={qrDataUrl}
                  alt={`QR ${activeBatch.batch_code}`}
                  className="w-48 h-48 rounded-xl border border-[#123B35]/10 bg-white p-2"
                />
                <div className="font-mono text-xs font-bold text-[#123B35]">
                  {activeBatch.batch_code}
                </div>
                <Link
                  to={`/track/${encodeURIComponent(activeBatch.qr_token)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#123B35] hover:underline"
                >
                  {tx(language, 'Open Public Tracking View', 'பொது கண்காணிப்புப் பக்கத்தைத் திற')}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Authorised Scan Event Logger — Strictly Restricted by Role */}
          {!publicView && profile && !canRecordAnyScan && (
            <div className="rounded-2xl bg-white border border-[#123B35]/10 p-5 text-xs text-[#64748B]">
              {tx(
                language,
                'Your role can view and share batch QR codes. Only Delivery Partners, Receiving Shelters, and Administrators can log handover scan events.',
                'உங்கள் பொறுப்பில் QR குறியீடுகளைப் பார்க்கவும் பகிரவும் முடியும். விநியோகப் பங்குதாரர்கள், பெறும் காப்பகங்கள் மற்றும் நிர்வாகிகள் மட்டுமே ஸ்கேன் நிகழ்வுகளைப் பதிவு செய்ய முடியும்.'
              )}
            </div>
          )}

          {canRecordAnyScan && (
            <form
              onSubmit={handleRecordScan}
              className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
            >
              <h3 className="text-sm font-bold font-display text-[#123B35]">
                {tx(language, 'Record Handover Scan Event', 'ஒப்படைப்பு ஸ்கேன் நிகழ்வைப் பதிவு செய்')}
              </h3>

              {errorMsg && (
                <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-3 py-2 text-xs text-[#123B35]">
                  {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="mt-event" className="block text-xs font-semibold text-[#123B35] mb-1">
                  {tx(language, 'Milestone Event *', 'நிகழ்வு வகை *')}
                </label>
                <select
                  id="mt-event"
                  value={scanEventType}
                  onChange={(e) => setScanEventType(e.target.value as ScannableMealTraceEvent)}
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-semibold"
                >
                  {allowedScanEvents.map((ev) => (
                    <option key={ev} value={ev}>
                      {scanEventOptionLabel(ev)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mt-temp" className="block text-xs font-semibold text-[#123B35] mb-1">
                    {tx(language, 'Temp at Scan (°C)', 'வெப்பநிலை (°C)')}
                  </label>
                  <input
                    id="mt-temp"
                    type="number"
                    step="0.1"
                    value={recordedTemp}
                    onChange={(e) => setRecordedTemp(e.target.value)}
                    className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
                {scanEventType === 'PORTIONS_CONFIRMED' && (
                  <div>
                    <label htmlFor="mt-portions" className="block text-xs font-semibold text-[#123B35] mb-1">
                      {tx(language, 'Confirmed Portions *', 'உறுதிப்படுத்தப்பட்ட பங்குகள் *')}
                    </label>
                    <input
                      id="mt-portions"
                      type="number"
                      min={1}
                      required
                      value={confirmedPortions}
                      onChange={(e) => setConfirmedPortions(e.target.value)}
                      className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono tabular-nums"
                    />
                  </div>
                )}
              </div>

              {scanEventType === 'PORTIONS_CONFIRMED' && (
                <div>
                  <label htmlFor="mt-area" className="block text-xs font-semibold text-[#123B35] mb-1">
                    {tx(language, 'Distribution Area *', 'விநியோகப் பகுதி *')}
                  </label>
                  <input
                    id="mt-area"
                    type="text"
                    required
                    value={distributionArea}
                    onChange={(e) => setDistributionArea(e.target.value)}
                    className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label htmlFor="mt-notes" className="block text-xs font-semibold text-[#123B35] mb-1">
                  {tx(language, 'Handover Notes', 'ஒப்படைப்புக் குறிப்புகள்')}
                </label>
                <input
                  id="mt-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tx(
                    language,
                    'Seal intact, container count verified',
                    'முத்திரை சரியாக உள்ளது, பாத்திர எண்ணிக்கை சரிபார்க்கப்பட்டது'
                  )}
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={!activeBatch}
                className="w-full px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
              >
                {tx(language, 'Save Scan Event', 'ஸ்கேன் நிகழ்வைச் சேமி')}
              </button>
            </form>
          )}
        </section>

        {/* Right: Immutable Append-Only Event Timeline */}
        <section className="xl:col-span-7 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-5">
          {!activeBatch ? (
            <div className="p-8 text-center text-sm text-[#64748B]">
              {tx(
                language,
                'No batch matched this token. Enter a valid QR token or scan a batch QR code.',
                'இந்தக் குறியீட்டிற்குப் பொருந்தும் உணவுத் தொகுதி இல்லை. சரியான QR குறியீட்டை உள்ளிடவும்.'
              )}
            </div>
          ) : (
            <>
              <div className="border-b border-[#123B35]/10 pb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs font-bold text-[#64748B]">
                    {activeBatch.batch_code}
                  </div>
                  <h3 className="mt-1 text-lg font-bold font-display text-[#123B35]">
                    {formatFoodName(activeBatch.food_item, language)}
                  </h3>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {formatDietary(activeBatch.dietary_type, language)} · {activeBatch.portions_available}{' '}
                    {t.common.portions} · {tx(language, 'Safety:', 'பாதுகாப்பு:')}{' '}
                    {activeBatch.safety_gate_passed
                      ? tx(language, 'PASSED', 'தேர்ச்சி')
                      : tx(language, 'PENDING', 'நிலுவையில்')}
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-[#123B35]">
                    {formatBatchStatus(activeBatch.status, language)}
                  </div>
                  <div className="text-[#64748B]">
                    {tx(language, 'Use by:', 'கடைசி நேரம்:')}{' '}
                    {new Date(activeBatch.consume_by_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#64748B] mb-4">
                  {tx(language, 'Chain of Custody', 'கண்காணிப்பு வரலாறு')} ({batchEvents.length})
                </h4>
                <ol className="space-y-4">
                  {batchEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-xl bg-[#FFF9EF] border border-[#123B35]/10 p-4 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#123B35] inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                          {formatMealTraceEvent(ev.event_type, language)}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {!publicView && ev.actor_label
                            ? `${tx(language, 'By:', 'பதிவு செய்தவர்:')} ${ev.actor_label} · `
                            : ''}
                          {ev.recorded_temp !== null
                            ? `${tx(language, 'Temp:', 'வெப்பநிலை:')} ${ev.recorded_temp}°C`
                            : ''}
                          {ev.confirmed_portions !== null
                            ? `${ev.recorded_temp !== null ? ' · ' : ''}${tx(
                                language,
                                'Confirmed:',
                                'உறுதிப்படுத்தப்பட்டது:'
                              )} ${ev.confirmed_portions} ${t.common.portions}`
                            : ''}
                        </div>
                      </div>
                      <div className="font-mono tabular-nums text-[11px] text-[#64748B] shrink-0">
                        {new Date(ev.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
