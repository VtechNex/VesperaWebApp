import React, { useState } from 'react'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Button } from '../../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../components/ui/dialog'
import { Eye, EyeOff } from 'lucide-react'

function UserProfileSettings({ user }) {
  const [activeTab, setActiveTab] = useState('profile')

  const [form, setForm] = useState({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
    organization: 'Vespera Estates Pvt Ltd',
    designation: '',
    website: '',
    email: user?.email || '',
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
  })

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

  const totalFields = Object.keys(form).length
  const completedFields = Object.values(form).filter((v) => v && String(v).trim() !== '').length
  const completion = Math.round((completedFields / Math.max(totalFields, 1)) * 100)

  const tabs = [
    { id: 'profile', label: 'User Profile' },
    { id: 'business-card', label: 'My Business Card' },
    { id: 'password', label: 'Change Password' },
    { id: 'communications', label: 'Email / WhatsApp Preference' },
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

  const PrefRow = ({ checked, onChange, label, helper }) => (
    <label className="flex items-start gap-3 text-xs md:text-sm text-white/80 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-white/40 bg-black/40"
      />
      <span>
        <div>{label}</div>
        {helper && <div className="text-[11px] text-white/50 mt-0.5">{helper}</div>}
      </span>
    </label>
  )

  return (
    <div className="rounded-2xl card-surface border border-white/10 p-4 md:p-6 space-y-6">
      {/* Header + internal tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#D4AF37]">User Settings</h2>
          <p className="text-xs md:text-sm text-white/60">
            Manage your personal profile, business card and communication preferences.
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

      {/* Avatar section */}
      <div className="flex flex-col items-center gap-3 py-4 border-b border-white/10">
        <div className="relative">
          <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-2 border-[#D4AF37] bg-black/70 flex items-center justify-center text-3xl font-semibold text-[#D4AF37]">
            {(user?.name && user.name[0]) || 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[10px] text-black font-semibold shadow-lg">
            Edit
          </div>
        </div>
        <p className="text-xs text-white/60">Profile picture</p>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="First name" required>
              <Input value={form.firstName} onChange={updateField('firstName')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
            <Field label="Last name" required>
              <Input value={form.lastName} onChange={updateField('lastName')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
            <Field label="Designation">
              <Input value={form.designation} onChange={updateField('designation')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Email" required>
              <Input value={form.email} onChange={updateField('email')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
            <Field label="Mobile">
              <Input value={form.mobile} onChange={updateField('mobile')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
            <Field label="Organization">
              <Input value={form.organization} onChange={updateField('organization')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="City">
              <Input value={form.city} onChange={updateField('city')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={updateField('state')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={updateField('country')} className="bg-black/40 border-white/15 text-white text-sm" />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button className="gold-btn gold-shine px-4 py-2">Save</Button>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Old password">
              <div className="relative">
                <Input
                  type={showPassword.oldPassword ? 'text' : 'password'}
                  value={passwordForm.oldPassword}
                  onChange={updatePasswordField('oldPassword')}
                  className="bg-black/40 border-white/20 text-white text-sm pr-10"
                />
                <button type="button" onClick={togglePasswordVisibility('oldPassword')} className="absolute right-2 top-2">
                  {showPassword.oldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field label="New password">
              <div className="relative">
                <Input
                  type={showPassword.newPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={updatePasswordField('newPassword')}
                  className="bg-black/40 border-white/20 text-white text-sm pr-10"
                />
                <button type="button" onClick={togglePasswordVisibility('newPassword')} className="absolute right-2 top-2">
                  {showPassword.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirm password">
              <div className="relative">
                <Input
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={updatePasswordField('confirmPassword')}
                  className="bg-black/40 border-white/20 text-white text-sm pr-10"
                />
                <button type="button" onClick={togglePasswordVisibility('confirmPassword')} className="absolute right-2 top-2">
                  {showPassword.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button className="gold-btn gold-shine px-4 py-2">Change Password</Button>
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="font-semibold text-white">Email Notifications</div>
              <PrefRow checked={prefs.emailAssign} onChange={togglePref('emailAssign')} label="Assignments" />
              <PrefRow checked={prefs.emailComments} onChange={togglePref('emailComments')} label="Comments" />
              <PrefRow checked={prefs.emailFollowups} onChange={togglePref('emailFollowups')} label="Follow-ups" />
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-white">WhatsApp Notifications</div>
              <PrefRow checked={prefs.waAssign} onChange={togglePref('waAssign')} label="Assignments" />
              <PrefRow checked={prefs.waFollowups} onChange={togglePref('waFollowups')} label="Follow-ups" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="gold-btn gold-shine px-4 py-2">Save Preferences</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfileSettings
