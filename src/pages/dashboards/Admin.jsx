import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { ChevronDown, Building2, Image as ImageIcon } from "lucide-react"
import ManagePropertiesMedia from './components/ManagePropertiesMedia'
import {
  LayoutGrid,
  Users2,
  UserPlus,
  ListChecks,
  Settings
} from 'lucide-react'
import SiteHeader from '../../components/layout/SiteHeader'
import SiteFooter from '../../components/layout/SiteFooter'
import ManageList from './components/ManageList'
import ManageLeads from './components/ManageLeads'
import AddLeads from './components/AddLeads'
import ManageUsers from './components/ManageUsers'
import CompanyProfileSettings from './components/Settings/CompanyProfileSettings.jsx'
import LeadStageCustomization from './components/Settings/LeadStageCustomization.jsx'
import ManageQualifiers from './components/Settings/ManageQualifiers.jsx'
import UserProfileSettings from './components/Settings/UserProfileSettings.jsx'
import LISTS from '../../services/listService'
import LEADS from '../../services/leadService'

function MiniBarChart({ data = [], labels = [] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="h-36 w-full flex items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex-1">
          <div
            className="rounded-sm bg-gradient-to-t from-[#D4AF37]/20 via-[#D4AF37]/40 to-[#D4AF37]/60"
            style={{ height: `${(v / max) * 100}%` }}
            title={`${labels[i] || ''} — ${v}`}
          />
        </div>
      ))}
    </div>
  )
}

function formatCurrency(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (Number.isNaN(n)) return String(amount)
  // Indian formatting (₹)
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function safeDateString(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString()
  } catch {
    return String(d)
  }
}

// GenericTable
function GenericTable({
  columns = [],
  rows = [],
  totalLabel = "",
  totalValue = "",
  totalValue2 = "",
  extraRow = null,
  width = "300px",
  height = "300px"
}) {
  return (
    <div
      className="overflow-auto rounded-2xl border border-white/10 p-3"
      style={{ width, height }}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-white/60">
            {columns.map((col) => (
              <th key={col.accessor} className="text-left px-5 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-white/85">
          {/* Normal rows */}
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/10">
              {columns.map((col) => (
                <td key={col.accessor} className="px-5 py-3">
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}

          {/* Custom extra row if passed */}
          {extraRow}

          {/* TOTAL ROW — 3 columns */}
          <tr className="border-t border-white/20 font-semibold text-white">
            <td className="px-5 py-3">{totalLabel}</td>
            <td className="px-5 py-3">{totalValue}</td>
            <td className="px-5 py-3">{totalValue2}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GenericGraph({ labels = [], datasets = [], width = "400px" }) {
  return (
    <div
      className="rounded-2xl p-5 card-surface flex-1"
      style={{ width }}
    >
      <div className="flex flex-col">
        <div
          className="overflow-hidden"
          style={{ height: "200px" }}
        >
          <MiniBarChart labels={labels} data={datasets} />
        </div>

        <div className="mt-6 flex justify-start">
          <div
            className="flex gap-4 text-[10px] text-white/60 max-w-full overflow-x-auto"
            style={{ paddingBottom: "4px" }}
          >
            {labels.map((label, i) => (
              <span key={i} className="truncate text-center min-w-[40px]">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate()
  const onLogout = () => {
    signout()
    navigate('/')
  }

  // Tabs or states
  const [tab, setTab] = useState('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [manageLeadsOpen, setManageLeadsOpen] = useState(false)
  const [activeDashboardTab, setActiveDashboardTab] = useState("Lead Stage")
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [showListSelectModal, setShowListSelectModal] = useState(false)
  const [selectedLists, setSelectedLists] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [errorPopup, setErrorPopup] = useState("")

  // Domain data - using demo data
  const [lists, setLists] = useState([])
  const [leads, setLeads] = useState([])

  // Dashboard derived data states
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  // generic UI state flags
  const [globalLoading, setGlobalLoading] = useState(false)

  // Searchable List Dropdown form state
  const [form, setForm] = useState({
    listId: "",
    searchQuery: "",
    isDropdownOpen: false,
  })

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const isManageLeadsTab =
    tab === 'manage-leads' ||
    tab === 'manage-leads-all' ||
    tab === 'manage-leads-unattended'

  // Load data from backend
  const loadDashboard = async () => {
    setLoadingDashboard(true)
    setDashboardError('')
    try {
      const listsResponse = await LISTS.FETCH_WITH_COUNTS()
      const leadsResponse = await LEADS.FETCH_ALL()

      if (listsResponse?.status === 200 && listsResponse?.data?.data) {
        setLists(listsResponse.data.data)
      }
      if (leadsResponse?.status === 200 && leadsResponse?.data?.data) {
        setLeads(leadsResponse.data.data)
      }
    } catch (err) {
      setDashboardError(err?.message || 'Failed to load dashboard data')
      console.error('Dashboard load error:', err)
    } finally {
      setLoadingDashboard(false)
    }
  }

  // initial load
  useEffect(() => {
    loadDashboard()
  }, [])

  // compute total revenue from leads' potential
  const totalRevenue = useMemo(() => {
    if (!leads || leads.length === 0) return 0
    const sum = leads.reduce((acc, l) => {
      const p = Number(l.potential)
      return acc + (Number.isFinite(p) ? p : 0)
    }, 0)
    return sum
  }, [leads])

  const activeProperties = useMemo(() => {
    const props = new Set()
    for (const l of leads) {
      if (l.prop) props.add(String(l.prop))
      else if (l.notes && typeof l.notes === 'string') {
        const maybe = l.notes.split('\n')[0].slice(0, 60).trim()
        if (maybe) props.add(maybe)
      } else if (l.potential) {
        props.add(`potential:${l.potential}`)
      }
    }
    if (props.size === 0) {
      return leads.filter((l) => l.potential).length
    }
    return props.size
  }, [leads])

  // New leads: leads created within the last 30 days
  const newLeadsCount = useMemo(() => {
    if (!leads) return 0
    const now = Date.now()
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30
    return leads.reduce((acc, l) => {
      const t = l.created_at ? new Date(l.created_at).getTime() : 0
      return acc + (t && now - t <= THIRTY_DAYS ? 1 : 0)
    }, 0)
  }, [leads])

  // conversion rate
  const conversionRate = useMemo(() => {
    if (!leads || leads.length === 0) return 0
    const won = leads.filter((l) => {
      const s = (l.stage || '').toLowerCase()
      return s.includes('won') || s.includes('deal done') || s.includes('closed') || s.includes('deal done (won)')
    }).length
    return (won / leads.length) * 100
  }, [leads])

  // KPI breakdown counts
  const kpiCounts = useMemo(() => {
    const contacted = leads.filter((l) => (l.stage || '').toLowerCase().includes('contacted')).length
    const qualified = leads.filter((l) => (l.stage || '').toLowerCase().includes('qualified')).length
    const lost = leads.filter((l) => (l.stage || '').toLowerCase().includes('lost') || (l.stage || '').toLowerCase().includes('deal lost')).length
    return { contacted, qualified, lost }
  }, [leads])

  // Recent rows derived from leads
  const recentRows = useMemo(() => {
    if (!leads) return []
    const sorted = [...leads].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    return sorted.slice(0, 6).map((l) => ({
      id: l.id || `L-${String(l.email || '').slice(0, 4)}-${String(l.phone || '').slice(-3)}`,
      client: l.name || '—',
      prop: l.prop || (l.notes ? l.notes.split('\n')[0].slice(0, 40) : '—'),
      amount: l.potential ? formatCurrency(l.potential) : '—',
      status:
        (l.stage && typeof l.stage === 'string'
          ? l.stage
          : l.stage === 'Deal Done (Won)'
            ? 'Closed'
            : 'Pending'),
      date: safeDateString(l.created_at),
    }))
  }, [leads])

  // STEP 1 — Data for each tab
  const dashboardData = {
    "Lead Stage": {
      stages: [
        ["Open", 1],
        ["Inactive", 1],
        ["Contacted", 1],
        ["Contacted - Follow Up", 1],
        ["Qualified", 1],
        ["Qualified - Follow Up", 1],
        ["SV - Awaiting", 2],
        ["SV - Done - Follow Up", 1],
        ["Requirement", 1],
        ["Requirement - SENT", 1],
        ["Deal Lost", 2],
        ["Deal Done", 1]
      ]
    },

    "Deal Size": {
      stages: [
        ["Open", 1],
        ["Inactive", 1],
        ["Contacted", 1],
        ["Contacted - Follow Up", 1],
        ["Qualified", 1],
        ["Qualified - Follow Up", 1],
        ["SV - Awaiting", 2],
        ["SV - Done - Follow Up", 1],
        ["Requirement", 1],
        ["Requirement - SENT", 1],
        ["Deal Lost", 2],
        ["Deal Done", 1]
      ]
    },

    "Product Groups": {
      stages: [
        ["C - 2BHK", 1],
        ["B. 1BHK", 1],
        ["G - SHOP", 1],
        ["F - BANGLOW / VILLA", 1],
        ["D - 3BHK", 1]
      ]
    },

    "Customer Groups": {
      stages: [
        ["PURCHASE", 1],
        ["CONTACTED", 1],
        ["GREETING", 1],
        ["1. RENT", 1],
        ["Not Assigned", 1]
      ]
    },

    "Tags": {
      stages: [
        ["Pisoli", 1],
        ["Undri", 1],
        ["Handewadi", 1],
        ["Talab", 1],
        ["Kondhwa khurdh", 1]
      ]
    },

    "Potential": {
      stages: [
        ["High", 1],
        ["Medium", 1],
        ["Low", 1]
      ]
    }
  }

  // STEP 2 — Select data for the active tab
  const activeData = dashboardData[activeDashboardTab]
  const leadStageCounts = activeData?.stages || []

  // STEP 3 — Derive values

  // Convert into table rows
  const rows = leadStageCounts.map(([stage, count]) => ({
    stage,
    count,
    value: "₹" + (count * 10000).toLocaleString()
  }))

  // Labels for graph
  const labels = leadStageCounts.map(([stage]) => stage)

  // Values for graph
  const dataValues = leadStageCounts.map(([stage, count]) => count * 10000)

  // Total leads (sum of counts)
  const totalLeads = leadStageCounts.reduce((sum, [, count]) => sum + count, 0)

  // Total Value (INR)
  const totalValueINR = leadStageCounts.reduce(
    (sum, [, count]) => sum + count * 10000,
    0
  )

  const totalValueINRFormatted = "₹" + totalValueINR.toLocaleString()

  const NavItem = ({ icon: Icon, label, id }) => (
    <button
      onClick={() => setTab(id)}
      className={`w-full inline-flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-colors ${tab === id ? 'bg-[color:var(--gold)]/15 text-gold border-[#D4AF37]/40' : 'bg-white/5 text-white/75 hover:text-white border-white/10'
        }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  )

  // Backend API CRUD functions
  const createList = async (name, description) => {
    const response = await LISTS.CREATE({ name, description })
    if (response?.status === 201 && response?.data?.data) {
      const newList = response.data.data
      setLists(prev => [newList, ...prev])
      return newList
    }
    throw new Error(response?.data?.message || 'Failed to create list')
  }

  const deleteList = async (id) => {
    const response = await LISTS.DELETE(id)
    if (response?.status === 200) {
      setLists(prev => prev.filter(l => String(l.id) !== String(id)))
      return
    }
    throw new Error(response?.data?.message || 'Failed to delete list')
  }

  const updateListApi = async (id, data) => {
    const response = await LISTS.UPDATE(id, data)
    if (response?.status === 200 && response?.data?.data) {
      const updatedList = response.data.data
      setLists(prev => prev.map(l => String(l.id) === String(id) ? updatedList : l))
      return updatedList
    }
    throw new Error(response?.data?.message || 'Failed to update list')
  }

  const createLead = async (payload) => {
    const response = await LEADS.CREATE(payload)
    if (response?.status === 201 && response?.data?.data) {
      const newLead = response.data.data
      setLeads(prev => [newLead, ...prev])
      return newLead
    }
    throw new Error(response?.data?.message || 'Failed to create lead')
  }

  const deleteLead = async (id) => {
    const response = await LEADS.DELETE(id)
    if (response?.status === 200) {
      setLeads(prev => prev.filter(x => String(x.id) !== String(id)))
      return
    }
    throw new Error(response?.data?.message || 'Failed to delete lead')
  }

  return (
    <div className="fade-in min-h-screen bg-black text-white">
      <SiteHeader authMode="dashboard" onLogout={onLogout} />
      <div className="flex min-h-[calc(100vh-160px)]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0B0B0B]">
          <div className="px-5 pt-9 pb-5 border-b border-white/10">
            <div className="text-[13px] tracking-[0.25em]">
              ADMIN PANEL
            </div>
            <div className="text-white/60 text-xs mt-1">
              Authorized Access
            </div>
          </div>

          <nav className="p-4 grid gap-2">
            <NavItem icon={LayoutGrid} label="Dashboard" id="dashboard" />
            <NavItem icon={ListChecks} label="Manage List" id="manage-list" />

            {/* Manage Leads dropdown */}
            <div className="mt-1">
              <button
                type="button"
                onClick={() => {
                  setManageLeadsOpen((prev) => !prev)
                  setTab('manage-leads-all')
                }}
                className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-sm border bg-white/5 text-white/75 hover:text-white border-white/10 ${isManageLeadsTab
                  ? 'bg-[color:var(--gold)]/15 text-gold border-[#D4AF37]/40'
                  : ''
                  }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Users2 className="h-4 w-4" />
                  <span>Manage Leads</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${manageLeadsOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {manageLeadsOpen && (
                <div className="mt-1 ml-8 grid gap-1">
                  <NavItem icon={Users2} label="View All Leads" id="manage-leads-all"
                    onClick={() => {
                      setManageLeadsOpen((prev) => !prev)
                      setTab('manage-leads-all')
                    }} />
                  <NavItem
                    icon={Users2}
                    label="Unattended Leads"
                    id="manage-leads-unattended"
                    onClick={() => {
                      setManageLeadsOpen((prev) => !prev)
                      setTab('manage-leads-unattended')
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="w-full inline-flex items-center gap-3 px-3 py-2 rounded-md text-sm border 
             bg-white/5 text-white/75 hover:text-white border-white/10"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Leads</span>
            </button>
            <NavItem icon={Users} label="Manage Users" id="manage-users" />

            {/* Settings dropdown */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-sm border bg-white/5 text-white/75 hover:text-white border-white/10"
              >
                <span className="inline-flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {settingsOpen && (
                <div className="mt-1 ml-8 grid gap-1">
                  <NavItem icon={Users} label="User Profile" id="settings-user" />
                  <NavItem icon={Users} label="Company Profile" id="settings-company" />
                  <NavItem icon={Users} label="Manage Qualifiers" id="settings-qualifiers" />
                  <NavItem icon={Users} label="Lead Stage Customization" id="settings-lead-stage" />
                </div>
              )}
            </div>
          </nav>
          {/* Properties Media Tab Link */}
          <NavItem
            icon={Building2}
            label="Properties Media"
            id="manage-properties"
          />
          <div className="mt-auto p-4 border-t border-white/10">
            <Button className="w-full border border-white/20 bg-white/10 hover:bg-white/15" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Top divider (header content removed) */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="px-4 md:px-6 py-2" />
          </div>

          <div className="px-4 md:px-6 py-6 grid gap-6">
            {/* === DASHBOARD TAB === */}
            {tab === 'dashboard' && (
              <div className="rounded-2xl card-surface border border-white/10 p-6 space-y-6">

                {/* Welcome + Selected List */}
                <div className="pb-3 border-b border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-white/70">
                        Welcome, <span className="text-gold font-semibold">Admin</span>!
                      </div>
                      <div className="text-xs text-white/60">Get a quick overview of your leads and customer data</div>
                    </div>

                    <div
                      className="inline-flex items-center gap-3 px-4 py-2 rounded-md border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 text-sm sm:text-base cursor-pointer"
                      onClick={() => setShowListSelectModal(true)}
                    >
                      {/* Selected List Label */}
                      <span className="text-white/70">Selected List</span>

                      {/* Purchase Text + Icon */}
                      <span className="inline-flex items-center gap-2">
                        PURCHASE <ChevronDown className="h-5 w-5" />
                      </span>
                    </div>

                  </div>
                </div>

                {/* Tabs row (UI + active state) */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    {
                      label: "Lead Stage", icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18l-6 8v6l-6 3v-9L3 4z" />
                        </svg>
                      )
                    },
                    {
                      label: "Deal Size", icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" strokeWidth={1.6} strokeLinecap="round" />
                        </svg>
                      )
                    },
                    {
                      label: "Product Groups", icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                          <circle cx="4" cy="7" r="1.2" fill="currentColor" />
                          <path d="M8.5 7h12.5" strokeLinecap="round" />
                          <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                          <path d="M8.5 12h12.5" strokeLinecap="round" />
                          <circle cx="4" cy="17" r="1.2" fill="currentColor" />
                          <path d="M8.5 17h12.5" strokeLinecap="round" />
                        </svg>
                      )
                    },
                    {
                      label: "Customer Groups", icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <rect x="10.5" y="3.5" width="3" height="3" rx="0.8" />
                          <path d="M12 7v4" strokeLinecap="round" />
                          <path d="M6 11h12" strokeLinecap="round" />
                          <path d="M6 11v3" strokeLinecap="round" />
                          <path d="M12 11v3" strokeLinecap="round" />
                          <path d="M18 11v3" strokeLinecap="round" />
                          <rect x="4.5" y="14.5" width="3" height="3" rx="0.8" />
                          <rect x="10.5" y="14.5" width="3" height="3" rx="0.8" />
                          <rect x="16.5" y="14.5" width="3" height="3" rx="0.8" />
                        </svg>
                      )
                    },
                    {
                      label: "Tags", icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <g transform="translate(-2, 2)">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12l-8 8-8-8V4h8l8 8z" />
                            <circle cx="9" cy="9" r="1.5" />
                          </g>
                        </svg>
                      )
                    },
                    {
                      label: "Potential", icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M12 17l-5 3 2-6-5-4h6L12 4l2 6h6l-5 4 2 6z" strokeWidth={1.6} />
                        </svg>
                      )
                    },
                  ].map((tabItem) => (
                    <button
                      key={tabItem.label}
                      onClick={() => setActiveDashboardTab(tabItem.label)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm ${activeDashboardTab === tabItem.label ? "bg-white/10 text-gold font-semibold" : "text-white/70 hover:bg-white/5"
                        }`}
                    >
                      {tabItem.icon}
                      {tabItem.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-6 rounded-lg text-white/70">
                  {activeDashboardTab === "Lead Stage" && (
                    <div className="flex gap-6">
                      <GenericTable
                        columns={[
                          { label: "Lead Stage", accessor: "stage" },
                          { label: "Leads", accessor: "count" },
                        ]}
                        rows={rows}
                        totalLabel="Total"
                        totalValue={totalLeads}
                        width="380px"
                        height="300px"
                      />

                      <GenericGraph
                        labels={labels}
                        datasets={[
                          {
                            label: "Lead Stage",
                            data: dataValues
                          }
                        ]}
                      />
                    </div>
                  )}

                  {activeDashboardTab === "Deal Size" && (
                    <div className="flex gap-6">
                      <GenericTable
                        columns={[
                          { label: "Lead Stage", accessor: "stage" },
                          { label: "Leads", accessor: "count" },
                          { label: "Value (INR)", accessor: "value" }
                        ]}
                        rows={rows}
                        totalLabel="Total"
                        totalValue={totalLeads}
                        totalValue2={totalValueINRFormatted}
                        width="380px"
                        height="300px"
                      />

                      <GenericGraph
                        labels={labels}
                        datasets={[
                          {
                            label: "Deal Size (INR)",
                            data: dataValues
                          }
                        ]}
                      />
                    </div>
                  )}

                  {activeDashboardTab === "Product Groups" && (
                    <div className="flex gap-6">
                      <GenericTable
                        columns={[
                          { label: "Product Groups", accessor: "stage" },
                          { label: "Leads", accessor: "count" },
                        ]}
                        rows={rows}
                        totalLabel="Total"
                        totalValue={totalLeads}
                        width="380px"
                        height="300px"
                      />

                      <GenericGraph
                        labels={labels}
                        datasets={[
                          {
                            label: "Product Groups",
                            data: dataValues
                          }
                        ]}
                      />
                    </div>
                  )}

                  {activeDashboardTab === "Customer Groups" && (
                    <div className="flex gap-6">
                      <GenericTable
                        columns={[
                          { label: "Customer Groups", accessor: "stage" },
                          { label: "Leads", accessor: "count" },
                        ]}
                        rows={rows}
                        totalLabel="Total"
                        totalValue={totalLeads}
                        width="380px"
                        height="300px"
                      />

                      <GenericGraph
                        labels={labels}
                        datasets={[
                          {
                            label: "Customer Groups",
                            data: dataValues
                          }
                        ]}
                      />
                    </div>
                  )}

                  {activeDashboardTab === "Tags" && (
                    <div className="flex gap-6">
                      <GenericTable
                        columns={[
                          { label: "Tags", accessor: "stage" },
                          { label: "Leads", accessor: "count" },
                        ]}
                        rows={rows}
                        totalLabel="Total"
                        totalValue={totalLeads}
                        width="380px"
                        height="300px"
                      />

                      <GenericGraph
                        labels={labels}
                        datasets={[
                          {
                            label: "Tags",
                            data: dataValues
                          }
                        ]}
                      />
                    </div>
                  )}

                  {activeDashboardTab === "Potential" && (
                    <div className="flex gap-6">
                      <GenericTable
                        columns={[
                          { label: "Potential", accessor: "stage" },
                          { label: "Leads", accessor: "count" },
                        ]}
                        rows={rows}
                        totalLabel="Total"
                        totalValue={totalLeads}
                        width="380px"
                        height="300px"
                      />

                      <GenericGraph
                        labels={labels}
                        datasets={[
                          {
                            label: "Potential",
                            data: dataValues
                          }
                        ]}
                      />
                    </div>
                  )}
                </div>

                {/* Error / loading */}
                {loadingDashboard && (
                  <div className="text-white/60 text-sm mt-4">Loading dashboard data...</div>
                )}
                {dashboardError && <div className="text-red-400 text-sm mt-4">{dashboardError}</div>}
              </div>
            )}

            {/* === MANAGE LIST TAB === */}
            {tab === 'manage-list' && (
              <ManageList
                lists={lists}
                onAddLeadClick={() => setShowAddLeadModal(true)}
                onDelete={async (id) => {
                  setGlobalLoading(true)
                  try {
                    await deleteList(id)
                  } finally {
                    setGlobalLoading(false)
                  }
                }}
                onUpdate={async (id, data) => {
                  setGlobalLoading(true)
                  try {
                    const updated = await updateListApi(id, data)
                    return updated
                  } finally {
                    setGlobalLoading(false)
                  }
                }}
              />
            )}

            {/* === MANAGE LEADS TAB === */}
            {(
              tab === 'manage-leads' ||
              tab === 'manage-leads-all' ||
              tab === 'manage-leads-unattended'
            ) && (
                <ManageLeads
                  lists={lists}
                  initialViewMode={
                    tab === 'manage-leads-unattended' ? 'unattended' : 'all'
                  }
                />
              )}

            {/* === MANAGE USERS TAB === */}
            {tab === 'manage-users' && <ManageUsers />}

            {/* Add Lead Modal */}
            {showAddLeadModal && (
              <div className="fixed inset-0 z-50">

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/70 z-10"></div>

                {/* Center Wrapper */}
                <div className="absolute inset-0 flex justify-center pl-20 py-10 z-20 pointer-events-none">

                  {/* Modal Box */}
                  <div
                    className="fade-in bg-black rounded-2xl p-6 w-[1200px] h-[85vh] flex flex-col
        border border-white/10 shadow-xl overflow-hidden 
        relative z-30 pointer-events-auto"
                  >

                    {/* Close Button */}
                    <button
                      onClick={() => setShowAddLeadModal(false)}
                      className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center
            rounded-full border border-white/20 text-white hover:bg-white/10 transition z-[60]"
                    >
                      ✕
                    </button>

                    {/* Add Lead Form */}
                    <AddLeads
                      lists={lists}
                      onCancel={() => setShowAddLeadModal(false)}
                      onCreate={async (payload) => {
                        setGlobalLoading(true)
                        try {
                          const saved = await createLead(payload)
                          setShowAddLeadModal(false)
                          return saved
                        } catch (err) {
                          throw err
                        } finally {
                          setGlobalLoading(false)
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}


            {/* List Select Modal */}
            {showListSelectModal && (
              <div className="fixed inset-0 z-50 fade-in">

                {/* Overlay (removed onClick to prevent closing) */}
                <div className="absolute inset-0 bg-black/70 z-10"></div>

                {/* Modal Container */}
                <div className="absolute inset-0 flex justify-center items-start pt-20 z-20 pointer-events-none">
                  <div className="bg-black rounded-2xl p-6 w-[600px] border border-white/10 shadow-xl relative pointer-events-auto">

                    {/* Close Button */}
                    <button
                      onClick={() => setShowListSelectModal(false)}
                      className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition"
                    >
                      ✕
                    </button>

                    {/* Header */}
                    <h3 className="text-white text-lg font-semibold mb-4">
                      List Selector ({selectedLists.length} of {lists.length} selected)
                    </h3>

                    {/* Search Input */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search by List Name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 rounded-md border border-white/15 bg-black text-white placeholder-white/50 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    {/* Select All Header */}
                    <label className="flex items-center gap-3 p-2 mb-2 font-semibold text-white border-b border-white/10">
                      <input
                        type="checkbox"
                        checked={selectedLists.length === lists.length && lists.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLists(lists.map((l) => l.id))
                          } else {
                            setSelectedLists([])
                          }
                        }}
                        className="
              h-5 w-5 rounded-md
              border-[#D4AF37]
              bg-black
              accent-[#D4AF37]
              focus:ring-[#D4AF37]
              focus:ring-1
            "
                      />
                      List Name
                    </label>

                    {/* Checkbox List */}
                    <div className="max-h-[260px] overflow-y-auto pr-2 space-y-2 mb-4">
                      {lists
                        .filter((l) =>
                          l.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((l) => {
                          const isChecked = selectedLists.includes(l.id)
                          return (
                            <label
                              key={l.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/40 cursor-pointer hover:border-[#D4AF37]/50 transition"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedLists(prev =>
                                      prev.filter(id => id !== l.id)
                                    )
                                  } else {
                                    setSelectedLists(prev => [...prev, l.id])
                                  }
                                }}
                                className="
                      h-5 w-5 rounded-md
                      border-[#D4AF37]
                      bg-black
                      accent-[#D4AF37]
                      focus:ring-[#D4AF37]
                      focus:ring-1
                    "
                              />

                              {/* Name */}
                              <span className="text-white">
                                {l.name.toUpperCase()} {l.leadCount}
                              </span>
                            </label>
                          )
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-4">

                      {/* Cancel Button */}
                      <button
                        onClick={() => setShowListSelectModal(false)}
                        className="px-4 py-2 rounded-md border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>

                      {/* Proceed Button */}
                      <button
                        onClick={() => {
                          if (!selectedLists.length) {
                            setErrorPopup("Select at least one list")
                            return
                          }
                          update("listId", selectedLists[0])
                          setShowListSelectModal(false)
                        }}
                        className="px-4 py-2 rounded-md font-semibold shadow-lg transition gold-btn gold-shine"
                      >
                        Proceed ({selectedLists.length} list{selectedLists.length > 1 ? "s" : ""})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Popup Modal */}
            {errorPopup && (
              <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50">
                <div className="bg-black/90 border border-white/15 rounded-xl p-6 w-[400px] flex flex-col items-center gap-4">
                  <p className="text-white/90 text-center text-sm">{errorPopup}</p>
                  <button
                    onClick={() => setErrorPopup("")}
                    className="gold-btn gold-shine"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {/* === SETTINGS: USER PROFILE TAB === */}
            {tab === 'settings-user' && <UserProfileSettings />}

            {/* === NEW: PROPERTIES MEDIA TAB === */}
            {tab === 'manage-properties' && <ManagePropertiesMedia />}

            {/* === SETTINGS: COMPANY PROFILE TAB === */}
            {tab === 'settings-company' && <CompanyProfileSettings />}

            {/* === SETTINGS: MANAGE QUALIFIERS TAB === */}
            {tab === 'settings-qualifiers' && <ManageQualifiers />}

            {/* === SETTINGS: LEAD STAGE CUSTOMIZATION TAB === */}
            {tab === 'settings-lead-stage' && <LeadStageCustomization />}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  )
} 