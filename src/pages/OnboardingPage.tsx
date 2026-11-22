import React, { useState } from 'react';
import { Building2, FileText, MapPin, ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OrgType } from '../types/database';

export const OnboardingPage: React.FC = () => {
  const { profile, activeOrganisation, registerOrganisation, updateOrganisationCapacity, t } = useApp();

  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState<OrgType>(
    profile?.role === 'VERIFIED_NGO' || profile?.role === 'COMMUNITY_KITCHEN' || profile?.role === 'DELIVERY_PARTNER'
      ? profile.role
      : 'FOOD_DONOR'
  );
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('13.0102');
  const [lng, setLng] = useState('80.2155');
  const [contactPerson, setContactPerson] = useState(profile?.full_name ?? '');
  const [contactPhone, setContactPhone] = useState(profile?.phone ?? '');
  const [fssaiRegNo, setFssaiRegNo] = useState('');
  const [ngoRegNo, setNgoRegNo] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState('120');
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [capacityEdit, setCapacityEdit] = useState(String(activeOrganisation?.daily_capacity ?? 100));

  const captureGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser geolocation is unavailable on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setErrorMsg('Unable to read GPS location. You may enter coordinates manually.')
    );
  };

  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      const parsedCap = Number(dailyCapacity);
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
        setErrorMsg('Valid latitude and longitude coordinates are required.');
        return;
      }
      const res = await registerOrganisation({
        name: name.trim(),
        org_type: orgType,
        address: address.trim(),
        location_lat: parsedLat,
        location_lng: parsedLng,
        contact_person: contactPerson.trim(),
        contact_phone: contactPhone.trim(),
        fssai_reg_no: fssaiRegNo.trim() || undefined,
        ngo_reg_no: ngoRegNo.trim() || undefined,
        daily_capacity: Math.max(0, Math.round(parsedCap)),
        verificationFile,
      });
      if (res.error) setErrorMsg(res.error);
      else {
        setName('');
        setAddress('');
        setFssaiRegNo('');
        setNgoRegNo('');
        setVerificationFile(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCapacitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganisation) return;
    const res = await updateOrganisationCapacity(activeOrganisation.id, Number(capacityEdit));
    if (res.error) setErrorMsg(res.error);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold font-display text-[#123B35]">
          Profile &amp; Organisation Onboarding
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          Verification credentials are stored privately in Supabase Storage and reviewed strictly by
          administrators before food allocation access is enabled.
        </p>
      </div>

      {/* Current User & Active Organisation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#123B35]">
            <ShieldCheck className="w-4 h-4" />
            Authenticated User Profile
          </div>
          <dl className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-[#64748B]">Full Name</dt>
              <dd className="mt-1 font-semibold text-[#123B35]">{profile?.full_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Assigned Role</dt>
              <dd className="mt-1 font-semibold text-[#123B35]">
                {profile ? t.roles[profile.role] : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Email</dt>
              <dd className="mt-1 font-mono text-[#123B35] break-all">{profile?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Phone</dt>
              <dd className="mt-1 font-mono text-[#123B35]">{profile?.phone ?? 'Not set'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-white border border-[#123B35]/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#123B35]">
              <Building2 className="w-4 h-4" />
              Active Organisation
            </div>
            {activeOrganisation && (
              <span className="text-xs font-semibold text-[#123B35]">
                Status: {activeOrganisation.verification_status}
              </span>
            )}
          </div>

          {activeOrganisation ? (
            <div className="space-y-4">
              <div className="text-xs space-y-1.5">
                <div className="text-sm font-bold text-[#123B35]">{activeOrganisation.name}</div>
                <div className="text-[#64748B]">{activeOrganisation.address}</div>
                <div className="font-mono text-[#64748B]">
                  {activeOrganisation.fssai_reg_no ? `FSSAI: ${activeOrganisation.fssai_reg_no}` : ''}
                  {activeOrganisation.fssai_reg_no && activeOrganisation.ngo_reg_no ? ' · ' : ''}
                  {activeOrganisation.ngo_reg_no ? `NGO Reg: ${activeOrganisation.ngo_reg_no}` : ''}
                </div>
              </div>

              <form onSubmit={handleCapacitySave} className="pt-3 border-t border-[#123B35]/10 flex items-end gap-3">
                <div className="flex-1">
                  <label htmlFor="daily-cap-edit" className="block text-xs font-semibold text-[#123B35] mb-1">
                    Daily Receiving / Serving Capacity (portions)
                  </label>
                  <input
                    id="daily-cap-edit"
                    type="number"
                    min={0}
                    max={50000}
                    value={capacityEdit}
                    onChange={(e) => setCapacityEdit(e.target.value)}
                    className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#123B35] text-white text-xs font-semibold hover:bg-[#0B2723]"
                >
                  Update Capacity
                </button>
              </form>
            </div>
          ) : (
            <p className="text-xs text-[#64748B] leading-relaxed">
              You are not yet linked to an organisation. Complete the onboarding form below to
              submit your organisation for administrator verification.
            </p>
          )}
        </div>
      </div>

      {/* Organisation Onboarding Form */}
      <form
        onSubmit={handleRegisterOrg}
        className="rounded-2xl bg-white border border-[#123B35]/10 p-6 sm:p-8 space-y-6"
      >
        <div>
          <h3 className="text-lg font-bold font-display text-[#123B35]">
            Register Organisation for Verification
          </h3>
          <p className="mt-1 text-xs text-[#64748B]">
            New organisations enter <span className="font-mono">pending</span> status. Verification
            documents upload to the private <span className="font-mono">org-verification-docs</span>{' '}
            bucket and are never publicly exposed.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-[#FF795C] bg-[#FF795C]/10 px-4 py-3 text-xs font-medium text-[#123B35]">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="org-name" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Organisation Legal Name *
            </label>
            <input
              id="org-name"
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sri Annapoorna Community Trust"
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="org-type" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Organisation Category *
            </label>
            <select
              id="org-type"
              value={orgType}
              onChange={(e) => setOrgType(e.target.value as OrgType)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
            >
              <option value="FOOD_DONOR">Food Donor (Hotel / Wedding Hall / Caterer)</option>
              <option value="VERIFIED_NGO">Verified NGO / Shelter</option>
              <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
              <option value="DELIVERY_PARTNER">Delivery Logistics Partner</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="org-address" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Full Street Address *
            </label>
            <input
              id="org-address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, Locality, City, PIN Code"
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="org-lat" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Latitude *
            </label>
            <input
              id="org-lat"
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm font-mono tabular-nums"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="org-lng" className="block text-xs font-semibold text-[#123B35]">
                Longitude *
              </label>
              <button
                type="button"
                onClick={captureGeolocation}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#123B35] hover:underline"
              >
                <MapPin className="w-3.5 h-3.5" />
                Use Current GPS
              </button>
            </div>
            <input
              id="org-lng"
              type="number"
              step="any"
              required
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm font-mono tabular-nums"
            />
          </div>

          <div>
            <label htmlFor="org-contact" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Primary Contact Person *
            </label>
            <input
              id="org-contact"
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="org-phone" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Contact Phone *
            </label>
            <input
              id="org-phone"
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="org-fssai" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              FSSAI Registration / Licence Number
            </label>
            <input
              id="org-fssai"
              type="text"
              value={fssaiRegNo}
              onChange={(e) => setFssaiRegNo(e.target.value)}
              placeholder="14-digit FSSAI number (if applicable)"
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm font-mono"
            />
          </div>

          <div>
            <label htmlFor="org-ngo" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              NGO Darpan / Trust Registration Number
            </label>
            <input
              id="org-ngo"
              type="text"
              value={ngoRegNo}
              onChange={(e) => setNgoRegNo(e.target.value)}
              placeholder="Registration ID (for NGOs / Kitchens)"
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm font-mono"
            />
          </div>

          <div>
            <label htmlFor="org-capacity" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Daily Portion Capacity *
            </label>
            <input
              id="org-capacity"
              type="number"
              min={10}
              max={50000}
              required
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(e.target.value)}
              className="w-full rounded-xl border border-[#123B35]/20 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-sm font-mono tabular-nums"
            />
          </div>

          <div>
            <label htmlFor="org-doc" className="block text-xs font-semibold text-[#123B35] mb-1.5">
              Private Verification Document (PDF / JPG / PNG, max 5 MB)
            </label>
            <label
              htmlFor="org-doc"
              className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#123B35]/30 bg-[#FFF9EF]/40 px-3.5 py-2.5 text-xs text-[#64748B] cursor-pointer hover:border-[#123B35]"
            >
              <span className="truncate flex items-center gap-2">
                {verificationFile ? <FileText className="w-4 h-4 text-[#123B35]" /> : <Upload className="w-4 h-4" />}
                {verificationFile ? verificationFile.name : 'Choose FSSAI / NGO Registration PDF or Image'}
              </span>
              <input
                id="org-doc"
                type="file"
                accept=".pdf,image/jpeg,image/png"
                onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#123B35] text-white text-sm font-semibold hover:bg-[#0B2723] transition-colors disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Submit Organisation for Verification'}
          </button>
        </div>
      </form>
    </div>
  );
};
