import React, { useState } from 'react'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Button } from '../../../../components/ui/button'

function CompanyProfileSettings({ user }) {
  const [company, setCompany] = useState({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
    designation: '',
    email: user?.email || '',
    phone: '',
    orgName: 'Vespera Estates Pvt Ltd',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: 'India',
    zip: '',
    gstin: '',
    currency: 'INR - Indian Rupee',
    timezone: 'Asia/Kolkata',
  })

  const [salesOrgConfigured, setSalesOrgConfigured] = useState(false)

  const [accountSettings, setAccountSettings] = useState({
    listAccessRights: false,
    lockLeadsOnClose: false,
    autoDuplicateCheck: true,
  })

  const updateCompany = (field) => (e) => {
    const value = e.target.value
    setCompany((prev) => ({ ...prev, [field]: value }))
  }

  const toggleAccount = (field) => () => {
    setAccountSettings((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] md:text-xs text-white/70">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </Label>
      {children}
    </div>
  )

  const TogglePill = ({ enabled, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-5 w-10 items-center rounded-full border px-0.5 transition-colors ${
        enabled
          ? 'border-[#D4AF37]/70 bg-[#D4AF37]/30'
          : 'border-white/25 bg-white/5'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Top row: primary contact + branding / locale */}
      <div className="grid lg:grid-cols-[2fr,1.25fr] gap-6">
        {/* Primary Contact & Org details */}
        <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[11px] text-[#D4AF37] font-semibold">
                1
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-white">
                  Primary Contact and Organization Details
                </h3>
                <p className="text-[11px] md:text-xs text-white/60">
                  These details will be used in your quotes, invoices and other company communication.
                </p>
              </div>
            </div>
            <Button className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm">
              Save
            </Button>
          </div>

          <div className="space-y-4 mt-2">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="First Name" required>
                <Input
                  value={company.firstName}
                  onChange={updateCompany('firstName')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="Last Name" required>
                <Input
                  value={company.lastName}
                  onChange={updateCompany('lastName')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="Designation">
                <Input
                  value={company.designation}
                  onChange={updateCompany('designation')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Email" required>
                <Input
                  type="email"
                  value={company.email}
                  onChange={updateCompany('email')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="Phone" required>
                <Input
                  value={company.phone}
                  onChange={updateCompany('phone')}
                  placeholder="+91 -"
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
            </div>

            <Field label="Organization" required>
              <Input
                value={company.orgName}
                onChange={updateCompany('orgName')}
                className="bg-black/40 border-white/15 text-white text-sm"
              />
            </Field>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Address 1" required>
                <Input
                  value={company.address1}
                  onChange={updateCompany('address1')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="Address 2">
                <Input
                  value={company.address2}
                  onChange={updateCompany('address2')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="City">
                <Input
                  value={company.city}
                  onChange={updateCompany('city')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="State">
                <Input
                  value={company.state}
                  onChange={updateCompany('state')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="Country" required>
                <select
                  value={company.country}
                  onChange={updateCompany('country')}
                  className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-3 py-2 focus:outline-none"
                >
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Zip">
                <Input
                  value={company.zip}
                  onChange={updateCompany('zip')}
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
              <Field label="GSTIN">
                <Input
                  value={company.gstin}
                  onChange={updateCompany('gstin')}
                  placeholder="Example: 24AAXCC4172D1Z4"
                  className="bg-black/40 border-white/15 text-white text-sm"
                />
              </Field>
            </div>

            <div className="mt-1 text-[11px] md:text-xs text-white/50 border-t border-white/10 pt-2">
              The details provided above will be reflected in your quotes, invoices and Vespera billing
              information section.
            </div>
          </div>
        </section>

        {/* Branding & Locale settings */}
        <div className="space-y-6">
          {/* Branding */}
          <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[11px] text-[#D4AF37] font-semibold">
                  2
                </div>
                <h3 className="text-sm md:text-base font-semibold text-white">Branding</h3>
              </div>
              <Button className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm">Save</Button>
            </div>

            <div className="grid gap-4">
              <div className="text-[11px] md:text-xs text-white/60">Logo</div>
              <div className="grid grid-cols-2 gap-3 text-[11px] md:text-xs text-white/60">
                <div className="space-y-2">
                  <div className="text-white/80">Mobile App</div>
                  <div className="aspect-[3/2] rounded-lg border border-dashed border-white/20 bg-black/40 flex items-center justify-center text-white/40 text-[11px]">
                    Add Logo
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-white/80">Web App</div>
                  <div className="aspect-[3/2] rounded-lg border border-dashed border-white/20 bg-black/40 flex items-center justify-center text-white/40 text-[11px]">
                    Add Logo
                  </div>
                </div>
              </div>
              <p className="text-[10px] md:text-[11px] text-white/50">
                Image format should be PNG / JPG / JPEG.
              </p>
            </div>
          </section>

          {/* Locale settings */}
          <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[11px] text-[#D4AF37] font-semibold">
                  3
                </div>
                <h3 className="text-sm md:text-base font-semibold text-white">Locale Settings</h3>
              </div>
              <Button className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm">Save</Button>
            </div>

            <div className="space-y-4">
              <Field label="Currency">
                <select
                  value={company.currency}
                  onChange={updateCompany('currency')}
                  className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-3 py-2 focus:outline-none w-full"
                >
                  <option value="INR - Indian Rupee">INR - Indian Rupee</option>
                  <option value="USD - US Dollar">USD - US Dollar</option>
                  <option value="EUR - Euro">EUR - Euro</option>
                </select>
              </Field>

              <Field label="Time Zone">
                <select
                  value={company.timezone}
                  onChange={updateCompany('timezone')}
                  className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-3 py-2 focus:outline-none w-full"
                >
                  <option value="Asia/Kolkata">(GMT+5:30) Asia / Kolkata</option>
                  <option value="Asia/Dubai">(GMT+4:00) Asia / Dubai</option>
                  <option value="Europe/London">(GMT) Europe / London</option>
                </select>
              </Field>
            </div>
          </section>
        </div>
      </div>

      {/* Define sales organization */}
      <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[11px] text-[#D4AF37]">
              4
            </span>
            Define your Sales Organization
          </h3>
          <p className="text-[11px] md:text-xs text-white/60 mt-1">
            Streamline your sales process by creating regions, branches and divisions that fit your
            business.
          </p>
        </div>
        <Button
          className="gold-btn gold-shine px-6"
          onClick={() => setSalesOrgConfigured(true)}
        >
          {salesOrgConfigured ? 'Configured' : 'Configure'}
        </Button>
      </section>

      {/* Account settings cards */}
      <section className="rounded-2xl card-surface border border-white/15 p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[11px] text-[#D4AF37] font-semibold">
            5
          </div>
          <h3 className="text-sm md:text-base font-semibold text-white">Account Settings</h3>
        </div>

        <div className="space-y-4 text-[11px] md:text-xs text-white/80">
          {/* List based access rights */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <div className="font-semibold text-white">
                List based access rights
              </div>
              <p className="text-white/70">
                Define access rights for every list to maintain data confidentiality and also define
                hierarchy within your sales team.
              </p>
            </div>
            <Button className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm">
              Upgrade plan to use this feature
            </Button>
          </div>

          {/* Lock / unlock leads */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <div className="font-semibold text-white">
                Lock / unlock leads
              </div>
              <p className="text-white/70">
                Prevent data changes by locking specific leads once the deal is closed.
              </p>
            </div>
            <Button className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm">
              Upgrade plan to use this feature
            </Button>
          </div>

          {/* Automatic duplicate checking */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1 max-w-xl">
              <div className="font-semibold text-white">
                Automatic checking for duplicate leads and customers
              </div>
              <p className="text-white/70">
                Enable this option to check duplicate leads across your channels (forms, integrations,
                imports). Leads with same email or mobile number will be marked as unassigned and set as
                do-not-follow-up.
              </p>
            </div>
            <TogglePill
              enabled={accountSettings.autoDuplicateCheck}
              onClick={toggleAccount('autoDuplicateCheck')}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default CompanyProfileSettings
