import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Moon, RefreshCw, Sun, Users } from 'lucide-react'
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
import QUALIFIERS from '../../services/qualifierService'
import ErrorState from '../../components/ErrorState'
import EmptyState from '../../components/EmptyState'
import DashboardChartSkeleton from '../../components/ui/DashboardChartSkeleton'
import Skeleton from '../../components/ui/Skeleton'
import StatCardSkeleton from '../../components/ui/StatCardSkeleton'
import TableSkeleton from '../../components/ui/TableSkeleton'
import { useAuth } from '../../context/AuthContext'
import { buildDashboardAnalytics } from '../../utils/dashboardAnalytics'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

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
  const normalizedData = Array.isArray(datasets)
    ? datasets.flatMap((entry) => Array.isArray(entry?.data) ? entry.data : [])
    : []

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
          <MiniBarChart labels={labels} data={normalizedData} />
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

const DASHBOARD_METRICS = [
  "Lead Stage",
  "Deal Size",
  "Product Groups",
  "Customer Groups",
  "Tags",
  "Potential",
]

const DASHBOARD_METRIC_ICONS = {
  "Lead Stage": (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18l-6 8v6l-6 3v-9L3 4z" />
    </svg>
  ),
  "Deal Size": (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  ),
  "Product Groups": (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="4" cy="7" r="1.2" fill="currentColor" />
      <path d="M8.5 7h12.5" strokeLinecap="round" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" />
      <path d="M8.5 12h12.5" strokeLinecap="round" />
      <circle cx="4" cy="17" r="1.2" fill="currentColor" />
      <path d="M8.5 17h12.5" strokeLinecap="round" />
    </svg>
  ),
  "Customer Groups": (
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
  ),
  Tags: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <g transform="translate(-2, 2)">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12l-8 8-8-8V4h8l8 8z" />
        <circle cx="9" cy="9" r="1.5" />
      </g>
    </svg>
  ),
  Potential: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 17l-5 3 2-6-5-4h6L12 4l2 6h6l-5 4 2 6z" strokeWidth={1.6} />
    </svg>
  ),
}

function shortenLabel(label, max = 14) {
  if (!label) return "—"
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

function DashboardMetricTable({ title, rows, total, theme = 'dark' }) {
  const isLight = theme === 'light'
  return (
    <div className={`rounded-2xl border p-5 ${isLight ? 'border-black/10 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.28)]' : 'border-white/10 bg-black/30'}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</div>
          <div className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Live grouped counts for the selected scope</div>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-right ${isLight ? 'border-[#D4AF37]/30 bg-[#FFF7E0]' : 'border-[#D4AF37]/20 bg-[#D4AF37]/10'}`}>
          <div className={`text-[11px] uppercase tracking-[0.2em] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>Total</div>
          <div className="text-lg font-semibold text-[#D4AF37]">{total}</div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-xl border ${isLight ? 'border-black/10' : 'border-white/10'}`}>
        <table className="min-w-full text-sm">
          <thead>
            <tr className={isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/[0.04] text-white/60'}>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Count</th>
            </tr>
          </thead>
          <tbody className={isLight ? 'text-slate-800' : 'text-white/85'}>
            {rows.map((row) => (
              <tr key={row.label} className={isLight ? 'border-t border-black/10' : 'border-t border-white/10'}>
                <td className="px-4 py-3">{row.label}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#D4AF37]">{row.count}</td>
              </tr>
            ))}
            <tr className={`border-t font-semibold ${isLight ? 'border-black/15 text-slate-900' : 'border-white/20 text-white'}`}>
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DashboardMetricChart({ title, rows, total, theme = 'dark' }) {
  const isLight = theme === 'light'
  return (
    <div className={`rounded-2xl border p-5 ${isLight ? 'border-black/10 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.28)]' : 'border-white/10 bg-black/30'}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</div>
          <div className={`mt-1 text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Responsive bar chart for the selected metric</div>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-right ${isLight ? 'border-[#D4AF37]/30 bg-[#FFF7E0]' : 'border-[#D4AF37]/20 bg-[#D4AF37]/10'}`}>
          <div className={`text-[11px] uppercase tracking-[0.2em] ${isLight ? 'text-slate-500' : 'text-white/45'}`}>Total</div>
          <div className="text-lg font-semibold text-[#D4AF37]">{total}</div>
        </div>
      </div>

      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 12, right: 20, left: 0, bottom: 72 }}>
            <defs>
              <linearGradient id="vesperaGoldBar" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F1D27A" />
                <stop offset="60%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#A67C00" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.08)"} vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={72}
              tick={{ fill: isLight ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.7)", fontSize: 11 }}
              tickFormatter={(value) => shortenLabel(value, 16)}
            />
            <YAxis allowDecimals={false} tick={{ fill: isLight ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.7)", fontSize: 11 }} />
            <Tooltip
              cursor={{ fill: isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: isLight ? "#FFFFFF" : "#111111",
                border: isLight ? "1px solid rgba(15,23,42,0.12)" : "1px solid rgba(212,175,55,0.25)",
                borderRadius: "12px",
                color: isLight ? "#0F172A" : "#ffffff",
                boxShadow: isLight ? "0 18px 40px -24px rgba(15,23,42,0.35)" : "none",
              }}
              itemStyle={{ color: isLight ? "#A67C00" : "#F5E7B2" }}
              labelStyle={{ color: isLight ? "#0F172A" : "#FFFFFF", fontWeight: 600 }}
              formatter={(value) => [`${value}`, "Count"]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {rows.map((row) => (
                <Cell key={row.label} fill="url(#vesperaGoldBar)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const onLogout = () => {
    logout()
    navigate('/')
  }

  // Tabs or states
  const [tab, setTab] = useState(() => localStorage.getItem('vespera_admin_tab') || 'dashboard')
  const [settingsOpen, setSettingsOpen] = useState(() => localStorage.getItem('vespera_admin_settings_open') === 'true')
  const [manageLeadsOpen, setManageLeadsOpen] = useState(() => localStorage.getItem('vespera_admin_manage_leads_open') === 'true')
  const [activeDashboardTab, setActiveDashboardTab] = useState("Lead Stage")
  const [dashboardTheme, setDashboardTheme] = useState(() => localStorage.getItem('vespera_dashboard_theme') || 'dark')
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [showListSelectModal, setShowListSelectModal] = useState(false)
  const [selectedLists, setSelectedLists] = useState([])
  const [selectedLeadListId, setSelectedLeadListId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [errorPopup, setErrorPopup] = useState("")

  const [lists, setLists] = useState([])
  const [leads, setLeads] = useState([])
  const [tagNameMap, setTagNameMap] = useState({})

  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [dashboardError, setDashboardError] = useState('')
  const [hasLoadedDashboardOnce, setHasLoadedDashboardOnce] = useState(false)

  const [globalLoading, setGlobalLoading] = useState(false)
  const [leadRefreshKey, setLeadRefreshKey] = useState(0)

  const update = (field, value) => ({ field, value })

  const isManageLeadsTab =
    tab === 'manage-leads' ||
    tab === 'manage-leads-all' ||
    tab === 'manage-leads-unattended'

  const loadDashboard = async () => {
    setLoadingDashboard(true)
    setDashboardError('')
    try {
      const [listsResponse, leadsResponse, tagResponse] = await Promise.allSettled([
        LISTS.FETCH_WITH_COUNTS(),
        LEADS.FETCH_ALL(),
        QUALIFIERS.FETCH_ALL("tag"),
      ])

      if (listsResponse.status === 'fulfilled' && listsResponse.value?.status === 200 && listsResponse.value?.data?.data) {
        setLists(listsResponse.value.data.data)
      }
      if (leadsResponse.status === 'fulfilled' && leadsResponse.value?.status === 200 && leadsResponse.value?.data?.data) {
        setLeads(leadsResponse.value.data.data)
      }
      if (tagResponse.status === 'fulfilled' && tagResponse.value?.status === 200 && Array.isArray(tagResponse.value.data?.data)) {
        setTagNameMap(
          tagResponse.value.data.data.reduce((accumulator, tag) => {
            accumulator[String(tag.id)] = tag.name || String(tag.id)
            return accumulator
          }, {})
        )
      }

      if (listsResponse.status !== 'fulfilled' || leadsResponse.status !== 'fulfilled') {
        throw new Error('Dashboard data could not be loaded.')
      }
    } catch (err) {
      setDashboardError(err?.message || 'Failed to load dashboard data')
      console.error('Dashboard load error:', err)
    } finally {
      setLoadingDashboard(false)
      setHasLoadedDashboardOnce(true)
    }
  }

  // initial load
  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    localStorage.setItem('vespera_admin_tab', tab)
  }, [tab])

  useEffect(() => {
    localStorage.setItem('vespera_admin_settings_open', String(settingsOpen))
  }, [settingsOpen])

  useEffect(() => {
    localStorage.setItem('vespera_admin_manage_leads_open', String(manageLeadsOpen))
  }, [manageLeadsOpen])

  useEffect(() => {
    localStorage.setItem('vespera_dashboard_theme', dashboardTheme)
  }, [dashboardTheme])

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

  const selectedDashboardListName = useMemo(() => {
    if (!selectedLeadListId) return "All Lists"
    return lists.find((list) => String(list.id) === String(selectedLeadListId))?.name || "Selected List"
  }, [lists, selectedLeadListId])

  const dashboardAnalytics = useMemo(
    () => buildDashboardAnalytics(leads, selectedLeadListId, activeDashboardTab, { tagNameMap }),
    [activeDashboardTab, leads, selectedLeadListId, tagNameMap]
  )

  const dashboardRows = dashboardAnalytics.rows
  const dashboardScopedLeads = dashboardAnalytics.scopedLeads
  const dashboardTotal = dashboardAnalytics.total
  const showDashboardSkeleton = loadingDashboard && !hasLoadedDashboardOnce
  const showDashboardRefreshing = loadingDashboard && hasLoadedDashboardOnce
  const isLightDashboard = dashboardTheme === 'light'

  const dashboardStats = useMemo(() => {
    const now = Date.now()
    const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30
    const totalScopedLeads = dashboardScopedLeads.length
    const newLeads = dashboardScopedLeads.filter((lead) => {
      const timeValue = lead?.created_at || lead?.createdAt
      const createdAt = timeValue ? new Date(timeValue).getTime() : 0
      return createdAt && now - createdAt <= THIRTY_DAYS
    }).length
    const closedLeads = dashboardScopedLeads.filter((lead) => {
      const statusValue = `${lead?.deal_status || lead?.dealStatus || ""} ${lead?.lead_stage || lead?.leadStage || lead?.stage || ""}`.toLowerCase()
      return statusValue.includes('closed') || statusValue.includes('won') || statusValue.includes('deal done')
    }).length
    const followUps = dashboardScopedLeads.filter((lead) => lead?.follow_up_date || lead?.followUpDate).length

    return [
      { label: "Total Leads", value: totalScopedLeads, hint: selectedDashboardListName },
      { label: "New In 30 Days", value: newLeads, hint: "Recent acquisition" },
      {
        label: "Closed / Won",
        value: closedLeads,
        hint: totalScopedLeads ? `${Math.round((closedLeads / totalScopedLeads) * 100)}% conversion` : "No conversions yet",
      },
      { label: "Follow-Ups", value: followUps, hint: "Scheduled touchpoints" },
    ]
  }, [dashboardScopedLeads, selectedDashboardListName])

  const NavItem = ({ icon: Icon, label, id, onClick }) => (
    <button
      onClick={() => {
        setTab(id)
        onClick?.()
      }}
      className={`w-full inline-flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-colors ${
        tab === id
          ? 'bg-[color:var(--gold)]/15 text-gold border-[#D4AF37]/40'
          : isLightDashboard
            ? 'bg-white/70 text-slate-700 hover:text-slate-900 border-black/10 hover:bg-white'
            : 'bg-white/5 text-white/75 hover:text-white border-white/10'
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
      setSelectedLeadListId(prev => (String(prev) === String(id) ? '' : prev))
      await loadDashboard()
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
      setLeadRefreshKey(prev => prev + 1)
      await loadDashboard()
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
    <div className={`fade-in min-h-screen ${isLightDashboard ? 'admin-theme-light bg-[#f6f1e7] text-slate-900' : 'bg-black text-white'}`}>
      <SiteHeader authMode="dashboard" onLogout={onLogout} theme={dashboardTheme} />
      <div className="flex min-h-[calc(100vh-160px)]">
        {/* Sidebar */}
        <aside className={`hidden md:flex w-64 flex-col border-r ${isLightDashboard ? 'border-black/10 bg-[#efe7d8] text-slate-900' : 'border-white/10 bg-[#0B0B0B]'}`}>
          <div className={`px-5 pt-9 pb-5 ${isLightDashboard ? 'border-b border-black/10' : 'border-b border-white/10'}`}>
            <div className="text-[13px] tracking-[0.25em]">
              ADMIN PANEL
            </div>
            <div className={`text-xs mt-1 ${isLightDashboard ? 'text-slate-500' : 'text-white/60'}`}>
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
                  setSelectedLeadListId('')
                  setTab('manage-leads-all')
                }}
                className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-sm border ${
                  isManageLeadsTab
                    ? 'bg-[color:var(--gold)]/15 text-gold border-[#D4AF37]/40'
                    : isLightDashboard
                      ? 'bg-white/70 text-slate-700 hover:text-slate-900 border-black/10 hover:bg-white'
                      : 'bg-white/5 text-white/75 hover:text-white border-white/10'
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
                      setSelectedLeadListId('')
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
              className={`w-full inline-flex items-center gap-3 px-3 py-2 rounded-md text-sm border ${
                isLightDashboard
                  ? 'bg-white/70 text-slate-700 hover:text-slate-900 border-black/10 hover:bg-white'
                  : 'bg-white/5 text-white/75 hover:text-white border-white/10'
              }`}
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
                className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-sm border ${
                  isLightDashboard
                    ? 'bg-white/70 text-slate-700 hover:text-slate-900 border-black/10 hover:bg-white'
                    : 'bg-white/5 text-white/75 hover:text-white border-white/10'
                }`}
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
          <div className={`mt-auto p-4 ${isLightDashboard ? 'border-t border-black/10' : 'border-t border-white/10'}`}>
            <Button className={`w-full ${isLightDashboard ? 'border border-black/10 bg-white text-slate-900 hover:bg-slate-50' : 'border border-white/20 bg-white/10 hover:bg-white/15'}`} onClick={onLogout}>
              Logout
            </Button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Top divider (header content removed) */}
          <div className={`sticky top-0 z-10 backdrop-blur-xl ${isLightDashboard ? 'border-b border-black/10 bg-[rgba(246,241,231,0.88)]' : 'border-b border-white/10 bg-black/40'}`}>
            <div className="px-4 md:px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setDashboardTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  isLightDashboard
                    ? 'border-black/10 bg-white text-slate-800 hover:bg-slate-50'
                    : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {isLightDashboard ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {isLightDashboard ? 'Dark Theme' : 'Light Theme'}
              </button>
            </div>
          </div>

          <div className="px-4 md:px-6 py-6 grid gap-6">
            {/* === DASHBOARD TAB === */}
            {tab === 'dashboard' && (
              <div className={`rounded-2xl border p-6 space-y-6 transition-colors ${
                isLightDashboard
                  ? 'border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#f8f5ef_100%)] text-slate-900 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.3)]'
                  : 'card-surface border-white/10 text-white'
              }`}>
                <div className={`pb-4 ${isLightDashboard ? 'border-b border-black/10' : 'border-b border-white/10'}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className={isLightDashboard ? 'text-slate-700' : 'text-white/70'}>
                        Welcome, <span className="text-gold font-semibold">{user?.username || user?.name || 'Admin'}</span>
                      </div>
                      <div className={`mt-1 text-xs ${isLightDashboard ? 'text-slate-500' : 'text-white/60'}`}>
                        Dynamic lead analytics for {selectedDashboardListName}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      {showDashboardRefreshing ? (
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-[#D4AF37] ${
                          isLightDashboard ? 'border-[#D4AF37]/30 bg-[#FFF7E0]' : 'border-[#D4AF37]/20 bg-[#D4AF37]/10'
                        }`}>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Refreshing dashboard
                        </div>
                      ) : null}

                      {showDashboardSkeleton ? (
                        <Skeleton className="h-11 w-full rounded-xl sm:w-64" />
                      ) : (
                        <label className={`flex flex-col gap-1 text-sm ${isLightDashboard ? 'text-slate-600' : 'text-white/65'}`}>
                          <span>Selected List</span>
                          <select
                            value={selectedLeadListId}
                            onChange={(event) => setSelectedLeadListId(event.target.value)}
                            className={`min-w-[240px] rounded-xl border px-4 py-3 outline-none transition focus:border-[#D4AF37]/50 ${
                              isLightDashboard
                                ? 'border-black/10 bg-white text-slate-900'
                                : 'border-white/10 bg-black/50 text-white'
                            }`}
                          >
                            <option value="">All Lists</option>
                            {lists.map((list) => (
                              <option key={list.id} value={String(list.id)}>
                                {list.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {showDashboardSkeleton ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <StatCardSkeleton key={index} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {DASHBOARD_METRICS.map((metric) => (
                        <Skeleton key={metric} className="h-11 w-40 rounded-xl" />
                      ))}
                    </div>
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                      <TableSkeleton rows={8} columns={2} showPagination={false} />
                      <DashboardChartSkeleton />
                    </div>
                  </div>
                ) : dashboardError && !lists.length && !leads.length ? (
                  <ErrorState
                    title="Unable to load dashboard"
                    description={dashboardError}
                    onRetry={loadDashboard}
                  />
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {dashboardStats.map((stat) => (
                        <div key={stat.label} className={`rounded-2xl border p-5 ${
                          isLightDashboard
                            ? 'border-black/10 bg-white/90 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.28)]'
                            : 'border-white/10 bg-black/30'
                        }`}>
                          <div className={`text-xs uppercase tracking-[0.22em] ${isLightDashboard ? 'text-slate-500' : 'text-white/45'}`}>{stat.label}</div>
                          <div className={`mt-3 text-3xl font-semibold ${isLightDashboard ? 'text-slate-900' : 'text-white'}`}>{stat.value}</div>
                          <div className={`mt-2 text-xs ${isLightDashboard ? 'text-slate-500' : 'text-white/55'}`}>{stat.hint}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {DASHBOARD_METRICS.map((metric) => (
                        <button
                          key={metric}
                          onClick={() => setActiveDashboardTab(metric)}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                            activeDashboardTab === metric
                              ? 'border-[#D4AF37]/40 bg-[#D4AF37]/12 text-gold'
                              : isLightDashboard
                                ? 'border-black/10 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                : 'border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {DASHBOARD_METRIC_ICONS[metric]}
                          {metric}
                        </button>
                      ))}
                    </div>

                    {dashboardRows.length === 0 ? (
                      <EmptyState
                        title="No data available for this category."
                        description="Try a different metric or select a list that contains matching lead data."
                      />
                    ) : (
                      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                        <DashboardMetricTable
                          title={dashboardAnalytics.title}
                          rows={dashboardRows}
                          total={dashboardTotal}
                          theme={dashboardTheme}
                        />
                        <DashboardMetricChart
                          title={dashboardAnalytics.title}
                          rows={dashboardRows}
                          total={dashboardTotal}
                          theme={dashboardTheme}
                        />
                      </div>
                    )}

                    {dashboardError ? (
                      <ErrorState
                        title="Dashboard refresh failed"
                        description={dashboardError}
                        onRetry={loadDashboard}
                      />
                    ) : null}
                  </>
                )}
              </div>
            )}

            {/* === MANAGE LIST TAB === */}
            {tab === 'manage-list' && (
              <div className="admin-panel-page">
                <ManageList
                  lists={lists}
                  onAddLeadClick={() => setShowAddLeadModal(true)}
                  onViewLeads={(list) => {
                    setSelectedLeadListId(String(list?.id || ''))
                    setManageLeadsOpen(true)
                    setTab('manage-leads-all')
                  }}
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
              </div>
            )}

            {/* === MANAGE LEADS TAB === */}
            {(
              tab === 'manage-leads' ||
              tab === 'manage-leads-all' ||
              tab === 'manage-leads-unattended'
            ) && (
                <div className="admin-panel-page">
                  <ManageLeads
                    lists={lists}
                    initialViewMode={
                      tab === 'manage-leads-unattended' ? 'unattended' : 'all'
                    }
                    initialListId={tab === 'manage-leads-all' ? selectedLeadListId : ''}
                    refreshKey={leadRefreshKey}
                    theme={dashboardTheme}
                    onLeadDeleted={async () => {
                      setLeadRefreshKey(prev => prev + 1)
                      await loadDashboard()
                    }}
                  />
                </div>
              )}

            {/* === MANAGE USERS TAB === */}
            {tab === 'manage-users' && <div className="admin-panel-page"><ManageUsers /></div>}

            {/* Add Lead Modal */}
            {showAddLeadModal && (
              <div className={`fixed inset-0 z-50 ${isLightDashboard ? 'admin-modal' : ''}`}>

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
            {tab === 'settings-user' && <div className="admin-panel-page"><UserProfileSettings /></div>}

            {/* === NEW: PROPERTIES MEDIA TAB === */}
            {tab === 'manage-properties' && <div className="admin-panel-page"><ManagePropertiesMedia theme={dashboardTheme} /></div>}

            {/* === SETTINGS: COMPANY PROFILE TAB === */}
            {tab === 'settings-company' && <div className="admin-panel-page"><CompanyProfileSettings /></div>}

            {/* === SETTINGS: MANAGE QUALIFIERS TAB === */}
            {tab === 'settings-qualifiers' && <div className="admin-panel-page"><ManageQualifiers /></div>}

            {/* === SETTINGS: LEAD STAGE CUSTOMIZATION TAB === */}
            {tab === 'settings-lead-stage' && <div className="admin-panel-page"><LeadStageCustomization /></div>}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  )
} 
