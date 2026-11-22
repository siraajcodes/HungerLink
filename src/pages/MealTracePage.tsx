import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle2, ExternalLink, QrCode, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPublicAppBaseUrl } from '../lib/supabase';
import type { MealTraceEventType } from '../types/database';

export const MealTracePage: React.FC<{ publicView?: boolean }> = ({ publicView = false }) => {
  const { token: paramToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const initialToken = paramToken || searchParams.get('token') || '';

  const { batches, mealtraceEvents, recordMealTraceScan, profile } = useApp();

  const [activeToken, setActiveToken] = useState(
    initialToken || batches.find((b) => b.safety_gate_passed)?.qr_token || batches[0]?.qr_token || ''
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scanEventType, setScanEventType] =
    useState<Extract<MealTraceEventType, 'PICKUP_SCANNED' | 'HANDOVER_SCANNED' | 'PORTIONS_CONFIRMED'>>(
      'PICKUP_SCANNED'
    );
  const [recordedTemp, setRecordedTemp] = useState('62.5');
  const [confirmedPortions, setConfirmedPortions] = useState('60');
  const [distributionArea, setDistributionArea] = useState('Adyar & Velachery Community Sites');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Generate opaque QR code pointing to /track/:token (zero PII encoded)
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

  // Camera scanner lifecycle
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
      setCameraError('Browser camera access is unavailable. Enter the opaque QR token manually.');
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
      setCameraError('Camera permission denied or no camera device detected.');
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
    if (!activeBatch) {
      setErrorMsg('Resolve a valid MealTrace QR token before recording an event.');
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

  return (
    <div className={publicView ? 'min-h-screen bg-[#FFF9EF] p-6 sm:p-10 max-w-4xl mx-auto space-y-6' : 'space-y-6'}>
      {publicView && (
        <div className="flex items-center justify-between border-b border-[#123B35]/10 pb-4">
          <span className="text-lg font-extrabold font-display text-[#123B35]">
            HUNGERLINK · MealTrace Public Verification
          </span>
          <Link to="/" className="text-xs font-semibold text-[#123B35] underline">
            Open Platform
          </Link>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          MealTrace QR Chain-of-Custody
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Opaque, unpredictable tracking tokens with append-only custody events. Private recipient
          PII is never encoded in QR payloads.
        </p>
      </div>

      {/* Traceability vs Food Safety Notice */}
      <div className="rounded-2xl bg-white border border-[#123B35]/15 p-4 text-xs text-[#64748B] flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#123B35] shrink-0 mt-0.5" />
        <span>
          MealTrace provides append-only logistics traceability and handover accountability. It does
          not replace physical food-safety inspection or constitute government certification.
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: QR Code Card + Browser Camera Scanner */}
        <section className="xl:col-span-5 space-y-6">
          <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-[#123B35] flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Batch Tracking Token
              </h3>
              {!publicView && (
                <button
                  type="button"
                  onClick={() => (cameraActive ? stopCamera() : void startCameraScanner())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                >
                  {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  {cameraActive ? 'Stop Camera' : 'Scan with Camera'}
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
                  Select Approved Batch
                </label>
                <select
                  id="mt-select"
                  value={activeToken}
                  onChange={(e) => setActiveToken(e.target.value)}
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.qr_token}>
                      {b.batch_code} — {b.food_item} ({b.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="mt-token" className="block text-xs font-semibold text-[#123B35] mb-1">
                Opaque QR Token
              </label>
              <input
                id="mt-token"
                type="text"
                value={activeToken}
                onChange={(e) => setActiveToken(e.target.value)}
                placeholder="Paste opaque MealTrace token..."
                className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-mono"
              />
            </div>

            {activeBatch && qrDataUrl && (
              <div className="pt-2 flex flex-col items-center text-center space-y-2">
                <img
                  src={qrDataUrl}
                  alt={`MealTrace QR code for batch ${activeBatch.batch_code}`}
                  className="w-48 h-48 rounded-xl border border-[#123B35]/10 bg-white p-2"
                />
                <div className="font-mono text-xs font-bold text-[#123B35]">
                  {activeBatch.batch_code}
                </div>
                <Link
                  to={`/track/${encodeURIComponent(activeBatch.qr_token)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#123B35] hover:underline"
                >
                  Open Public Non-PII Tracking View
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Authorised Scan Event Logger (Hidden on Public View) */}
          {!publicView && profile && (
            <form
              onSubmit={handleRecordScan}
              className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4"
            >
              <h3 className="text-sm font-bold font-display text-[#123B35]">
                Record Custody Scan Event (Append-Only)
              </h3>

              {errorMsg && (
                <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-3 py-2 text-xs text-[#123B35]">
                  {errorMsg}
                </div>
              )}

              <div>
                <label htmlFor="mt-event" className="block text-xs font-semibold text-[#123B35] mb-1">
                  Milestone Event *
                </label>
                <select
                  id="mt-event"
                  value={scanEventType}
                  onChange={(e) =>
                    setScanEventType(
                      e.target.value as Extract<
                        MealTraceEventType,
                        'PICKUP_SCANNED' | 'HANDOVER_SCANNED' | 'PORTIONS_CONFIRMED'
                      >
                    )
                  }
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs font-semibold"
                >
                  <option value="PICKUP_SCANNED">Delivery Partner: Pickup Scanned</option>
                  <option value="HANDOVER_SCANNED">Receiving Org: Handover Scanned</option>
                  <option value="PORTIONS_CONFIRMED">
                    Receiving Org: Confirm Actual Portions (Updates ImpactLedger)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="mt-temp" className="block text-xs font-semibold text-[#123B35] mb-1">
                    Temp at Scan (°C)
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
                      Confirmed Portions *
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
                    Distribution Area *
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
                  Handover Notes
                </label>
                <input
                  id="mt-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Seal intact, container count verified"
                  className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={!activeBatch}
                className="w-full px-4 py-2.5 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723] disabled:opacity-40"
              >
                Append MealTrace Event
              </button>
            </form>
          )}
        </section>

        {/* Right: Immutable Append-Only Event Timeline */}
        <section className="xl:col-span-7 rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-5">
          {!activeBatch ? (
            <div className="p-8 text-center text-sm text-[#64748B]">
              No batch matched this token. Enter a valid opaque MealTrace token or scan a batch QR
              code.
            </div>
          ) : (
            <>
              <div className="border-b border-[#123B35]/10 pb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs font-bold text-[#64748B]">
                    {activeBatch.batch_code}
                  </div>
                  <h3 className="mt-1 text-lg font-bold font-display text-[#123B35]">
                    {activeBatch.food_item}
                  </h3>
                  <div className="mt-1 text-xs text-[#64748B]">
                    {activeBatch.dietary_type} · {activeBatch.portions_available} portions offered ·{' '}
                    Safety Gate: {activeBatch.safety_gate_passed ? 'PASSED' : 'PENDING'}
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-[#123B35]">{activeBatch.status}</div>
                  <div className="text-[#64748B]">
                    Use by: {new Date(activeBatch.consume_by_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#64748B] mb-4">
                  Append-Only Chain of Custody ({batchEvents.length} events)
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
                          {ev.event_type.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-[#64748B]">
                          {!publicView && ev.actor_label ? `Actor: ${ev.actor_label} · ` : ''}
                          {ev.recorded_temp !== null ? `Temp: ${ev.recorded_temp}°C` : ''}
                          {ev.confirmed_portions !== null
                            ? `${ev.recorded_temp !== null ? ' · ' : ''}Confirmed: ${ev.confirmed_portions} portions`
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
