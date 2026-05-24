import React, { useEffect, useState } from 'react'
import SETTINGS from '../../../../services/settingsService'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import LoadingButton from '../../../../components/ui/LoadingButton'
import { useToast } from '../../../../hooks/use-toast'
import ErrorState from '../../../../components/ErrorState'

const DEFAULT_COMPANY = {
  primaryContact: {
    firstName: '',
    lastName: '',
    designation: '',
    email: '',
    phone: '',
    orgName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'India',
    zip: '',
    gstin: '',
  },
  branding: {
    mobileLogoUrl: '',
    webLogoUrl: '',
  },
  locale: {
    currency: 'INR - Indian Rupee',
    timezone: 'Asia/Kolkata',
  },
  accountSettings: {
    autoDuplicateCheck: true,
  },
  salesOrgConfigured: false,
}

export default function CompanyProfileSettings() {
  const { toast } = useToast()
  const [company, setCompany] = useState(DEFAULT_COMPANY)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({ mobile: false, web: false })

  const loadCompany = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await SETTINGS.GET_COMPANY_PROFILE()
      if (response?.data?.data) {
        setCompany({
          ...DEFAULT_COMPANY,
          ...response.data.data,
          primaryContact: { ...DEFAULT_COMPANY.primaryContact, ...(response.data.data.primaryContact || {}) },
          branding: { ...DEFAULT_COMPANY.branding, ...(response.data.data.branding || {}) },
          locale: { ...DEFAULT_COMPANY.locale, ...(response.data.data.locale || {}) },
          accountSettings: { ...DEFAULT_COMPANY.accountSettings, ...(response.data.data.accountSettings || {}) },
        })
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to load company settings.'
      setLoadError(message)
      toast({ title: 'Company profile failed', description: message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompany()
  }, [])

  const updateSection = (section, field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setCompany((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const saveCompany = async () => {
    setSaving(true)
    try {
      await SETTINGS.SAVE_COMPANY_PROFILE(company)
      toast({ title: 'Company profile saved', description: 'Branding and locale settings were saved successfully.' })
    } catch (error) {
      toast({ title: 'Save failed', description: error?.response?.data?.message || 'Unable to save company profile.' })
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (key, file) => {
    if (!file) return
    setUploading((prev) => ({ ...prev, [key]: true }))
    try {
      const response = await SETTINGS.UPLOAD_BRANDING(file)
      const url = response?.data?.data?.url
      setCompany((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          [key === 'mobile' ? 'mobileLogoUrl' : 'webLogoUrl']: url,
        },
      }))
      toast({ title: 'Upload complete', description: 'Logo uploaded successfully. Save to persist it.' })
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Unable to upload this logo.' })
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }))
    }
  }

  const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] md:text-xs text-white/70">{label}</Label>
      {children}
    </div>
  )

  if (loading) {
    return <div className="rounded-2xl card-surface border border-white/10 p-6 text-white/70">Loading company profile...</div>
  }

  if (loadError) {
    return (
      <ErrorState
        title="Company profile unavailable"
        description={loadError}
        onRetry={loadCompany}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[2fr,1.25fr] gap-6">
        <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
            <div>
              <h3 className="text-sm md:text-base font-semibold text-white">Primary Contact and Organization Details</h3>
              <p className="text-[11px] md:text-xs text-white/60">These details are saved to the backend and reloaded on refresh.</p>
            </div>
            <LoadingButton loading={saving} className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm" onClick={saveCompany}>Save</LoadingButton>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="First Name"><Input value={company.primaryContact.firstName} onChange={updateSection('primaryContact', 'firstName')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Last Name"><Input value={company.primaryContact.lastName} onChange={updateSection('primaryContact', 'lastName')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Designation"><Input value={company.primaryContact.designation} onChange={updateSection('primaryContact', 'designation')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email"><Input value={company.primaryContact.email} onChange={updateSection('primaryContact', 'email')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Phone"><Input value={company.primaryContact.phone} onChange={updateSection('primaryContact', 'phone')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
          <Field label="Organization"><Input value={company.primaryContact.orgName} onChange={updateSection('primaryContact', 'orgName')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Address 1"><Input value={company.primaryContact.address1} onChange={updateSection('primaryContact', 'address1')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Address 2"><Input value={company.primaryContact.address2} onChange={updateSection('primaryContact', 'address2')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
              <h3 className="text-sm md:text-base font-semibold text-white">Branding</h3>
              <LoadingButton loading={saving} className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm" onClick={saveCompany}>Save</LoadingButton>
            </div>
            {[
              ['mobile', 'Mobile App', company.branding.mobileLogoUrl],
              ['web', 'Web App', company.branding.webLogoUrl],
            ].map(([key, label, currentUrl]) => (
              <div key={key} className="space-y-2">
                <div className="text-white/80 text-sm">{label}</div>
                <input type="file" accept="image/*" onChange={(e) => uploadLogo(key, e.target.files?.[0])} className="text-sm text-white" />
                {uploading[key] ? <div className="text-xs text-white/60">Uploading...</div> : null}
                {currentUrl ? <img src={currentUrl} alt={`${label} logo`} className="h-20 w-auto rounded border border-white/10 object-contain bg-black/40 p-2" /> : null}
              </div>
            ))}
          </section>

          <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
              <h3 className="text-sm md:text-base font-semibold text-white">Locale Settings</h3>
              <LoadingButton loading={saving} className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm" onClick={saveCompany}>Save</LoadingButton>
            </div>
            <Field label="Currency">
              <select value={company.locale.currency} onChange={updateSection('locale', 'currency')} className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-3 py-2 focus:outline-none w-full">
                <option value="INR - Indian Rupee">INR - Indian Rupee</option>
                <option value="USD - US Dollar">USD - US Dollar</option>
                <option value="EUR - Euro">EUR - Euro</option>
              </select>
            </Field>
            <Field label="Time Zone">
              <select value={company.locale.timezone} onChange={updateSection('locale', 'timezone')} className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-3 py-2 focus:outline-none w-full">
                <option value="Asia/Kolkata">(GMT+5:30) Asia / Kolkata</option>
                <option value="Asia/Dubai">(GMT+4:00) Asia / Dubai</option>
                <option value="Europe/London">(GMT) Europe / London</option>
              </select>
            </Field>
          </section>
        </div>
      </div>
    </div>
  )
}
