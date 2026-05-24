import React, { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import SETTINGS from '../../../../services/settingsService'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import LoadingButton from '../../../../components/ui/LoadingButton'
import { Button } from '../../../../components/ui/button'
import { useToast } from '../../../../hooks/use-toast'
import ErrorState from '../../../../components/ErrorState'

const PROFILE_DEFAULTS = {
  firstName: '',
  lastName: '',
  organization: '',
  designation: '',
  website: '',
  email: '',
  mobile: '',
  telephoneDirect: '',
  telephoneOffice: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'India',
  facebook: '',
  twitter: '',
  linkedin: '',
  instagram: '',
  personalUrl: '',
}

export default function UserProfileSettings() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState(PROFILE_DEFAULTS)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [prefs, setPrefs] = useState({
    emailAssign: false,
    emailComments: false,
    emailFollowups: true,
    emailProductUpdates: false,
    emailMarketing: false,
    waAssign: false,
    waFollowups: false,
  })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const loadProfile = async () => {
    setLoadingProfile(true)
    setLoadError('')
    try {
      const response = await SETTINGS.GET_PROFILE()
      const data = response?.data?.data
      if (data) {
        setForm({ ...PROFILE_DEFAULTS, ...data })
        setPrefs((prev) => ({ ...prev, ...(data.preferences || {}) }))
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to load your profile details.'
      setLoadError(message)
      toast({ title: 'Profile load failed', description: message })
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const updateField = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updatePasswordField = (field) => (e) => {
    const value = e.target.value
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  const togglePasswordVisibility = (field) => () => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const togglePref = (field) => () => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      await SETTINGS.UPDATE_PROFILE({ ...form, preferences: prefs })
      toast({ title: 'Profile saved', description: 'Your profile changes were saved successfully.' })
    } catch (error) {
      toast({ title: 'Save failed', description: error?.response?.data?.message || 'Unable to save your profile.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    setSavingPassword(true)
    try {
      await SETTINGS.CHANGE_PASSWORD(passwordForm)
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast({ title: 'Password updated', description: 'Your password has been changed.' })
    } catch (error) {
      toast({ title: 'Password update failed', description: error?.response?.data?.message || 'Unable to change your password.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'User Profile' },
    { id: 'password', label: 'Change Password' },
    { id: 'communications', label: 'Preferences' },
  ]

  const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] md:text-xs text-white/70">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </Label>
      {children}
    </div>
  )

  if (loadingProfile) {
    return <div className="rounded-2xl card-surface border border-white/10 p-6 text-white/70">Loading profile...</div>
  }

  if (loadError) {
    return (
      <ErrorState
        title="Profile unavailable"
        description={loadError}
        onRetry={loadProfile}
      />
    )
  }

  return (
    <div className="rounded-2xl card-surface border border-white/10 p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#D4AF37]">User Settings</h2>
          <p className="text-xs md:text-sm text-white/60">
            Manage your personal profile and password with persisted settings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-full border transition-colors ${
                activeTab === t.id
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'bg-black/40 text-white/70 border-white/20 hover:text-white hover:border-[#D4AF37]/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="First name" required><Input value={form.firstName} onChange={updateField('firstName')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Last name" required><Input value={form.lastName} onChange={updateField('lastName')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Designation"><Input value={form.designation} onChange={updateField('designation')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Email" required><Input value={form.email} onChange={updateField('email')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Mobile"><Input value={form.mobile} onChange={updateField('mobile')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Organization"><Input value={form.organization} onChange={updateField('organization')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Website"><Input value={form.website} onChange={updateField('website')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Direct line"><Input value={form.telephoneDirect} onChange={updateField('telephoneDirect')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Office line"><Input value={form.telephoneOffice} onChange={updateField('telephoneOffice')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="City"><Input value={form.city} onChange={updateField('city')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="State"><Input value={form.state} onChange={updateField('state')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
            <Field label="Country"><Input value={form.country} onChange={updateField('country')} className="bg-black/40 border-white/15 text-white text-sm" /></Field>
          </div>
          <div className="flex justify-end">
            <LoadingButton loading={savingProfile} className="gold-btn gold-shine px-4 py-2" onClick={saveProfile}>Save</LoadingButton>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {['oldPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <Field key={field} label={field === 'oldPassword' ? 'Current password' : field === 'newPassword' ? 'New password' : 'Confirm password'}>
                <div className="relative">
                  <Input
                    type={showPassword[field] ? 'text' : 'password'}
                    value={passwordForm[field]}
                    onChange={updatePasswordField(field)}
                    className="bg-black/40 border-white/20 text-white text-sm pr-10"
                  />
                  <button type="button" onClick={togglePasswordVisibility(field)} className="absolute right-2 top-2">
                    {showPassword[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            ))}
          </div>
          <div className="flex justify-end">
            <LoadingButton loading={savingPassword} className="gold-btn gold-shine px-4 py-2" onClick={savePassword}>Change Password</LoadingButton>
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(prefs).map((key) => (
              <label key={key} className="flex items-center gap-3 text-xs md:text-sm text-white/80 cursor-pointer">
                <input type="checkbox" checked={prefs[key]} onChange={togglePref(key)} className="h-4 w-4 rounded border-white/40 bg-black/40" />
                <span>{key}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <LoadingButton loading={savingProfile} className="gold-btn gold-shine px-4 py-2" onClick={saveProfile}>Save Preferences</LoadingButton>
          </div>
        </div>
      )}
    </div>
  )
}
