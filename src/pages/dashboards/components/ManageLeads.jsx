import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  Building2,
  Calendar,
  CalendarDays,
  CalendarClock,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Clock3,
  Download,
  Eye,
  FileText,
  Mail,
  MoreVertical,
  Phone,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  Users,
} from "lucide-react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import LEADS from "../../../services/leadService";
import QUALIFIERS from "../../../services/qualifierService";
import AUTH from "../../../services/authService";
import { useToast } from "../../../hooks/use-toast";
import { useAuth } from "../../../context/AuthContext";
import { exportLeadsReport } from "../../../utils/exportLeadsReport";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import StatCardSkeleton from "../../../components/ui/StatCardSkeleton";
import TableSkeleton from "../../../components/ui/TableSkeleton";
import usePermissions from "../../../hooks/usePermissions";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncateText(text, max = 120) {
  if (!text) return "-";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function getTimestampValue(lead) {
  const candidates = [
    lead?.created_at,
    lead?.createdAt,
    lead?.date,
    lead?.updated_at,
    lead?.updatedAt,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const numericId = Number(lead?.id);
  return Number.isFinite(numericId) ? numericId : 0;
}

function sortLeadsNewestFirst(leads = []) {
  return [...leads].sort((a, b) => {
    const timeDifference = getTimestampValue(b) - getTimestampValue(a);
    if (timeDifference !== 0) return timeDifference;

    const idDifference = Number(b?.id || 0) - Number(a?.id || 0);
    if (!Number.isNaN(idDifference) && idDifference !== 0) return idDifference;

    return String(b?.fname || "").localeCompare(String(a?.fname || ""));
  });
}

function EditSelect({
  value,
  placeholder = "Select",
  options = [],
  onChange,
  shellClassName,
  triggerClassName,
  menuClassName,
  iconClassName,
}) {
  const selectedOption = options.find((option) => String(option.value) === String(value));
  const displayLabel = selectedOption?.label || placeholder;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className={shellClassName}>
          <span className={triggerClassName}>{displayLabel}</span>
          <ChevronDown className={`${iconClassName} shrink-0`} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={10}
        align="start"
        className={menuClassName}
      >
        {options.map((option) => {
          const isActive = String(option.value) === String(value);

          return (
            <DropdownMenuItem
              key={`${option.value}-${option.label}`}
              onSelect={() => onChange(option.value)}
              className={`rounded-xl px-3 py-2.5 text-sm ${
                isActive ? "bg-[#D4AF37]/12 text-[#f4dd96]" : ""
              }`}
            >
              <span className="truncate">{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ManageLeads({
  lists = [],
  initialViewMode,
  initialListId = "",
  refreshKey = 0,
  onLeadDeleted,
  theme = "dark",
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const listDropdownRef = useRef(null);
  const toastRef = useRef(toast);
  const latestFetchIdRef = useRef(0);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [listFilter, setListFilter] = useState(() => searchParams.get("list") || initialListId || "");
  const [viewMode, setViewMode] = useState(() => searchParams.get("view") || initialViewMode || "all");
  const [page, setPage] = useState(() => {
    const parsed = Number(searchParams.get("page") || 1);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const parsed = Number(searchParams.get("pageSize") || PAGE_SIZE_OPTIONS[0]);
    return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : PAGE_SIZE_OPTIONS[0];
  });

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [productGroups, setProductGroups] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [assigneeList, setAssigneeList] = useState([]);
  const [moreOpenId, setMoreOpenId] = useState(null);
  const [dialogSaving, setDialogSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadPendingDelete, setLeadPendingDelete] = useState(null);
  const [leadDeleteLoading, setLeadDeleteLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 250);
  const canViewLeadPhone = hasPermission("canViewLeadPhone");
  const canEditLead = hasPermission("canEditLead");
  const canDeleteLead = hasPermission("canDeleteLead");
  const canExportLeads = hasPermission("canExportLeads");

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const syncSearchParams = useCallback(
    (nextState) => {
      const next = new URLSearchParams();

      if (nextState.search) next.set("search", nextState.search);
      if (nextState.listFilter) next.set("list", nextState.listFilter);
      if (nextState.viewMode) next.set("view", nextState.viewMode);
      if (nextState.page > 1) next.set("page", String(nextState.page));
      if (nextState.pageSize !== PAGE_SIZE_OPTIONS[0]) {
        next.set("pageSize", String(nextState.pageSize));
      }

      setSearchParams(next, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    syncSearchParams({ search, listFilter, viewMode, page, pageSize });
  }, [listFilter, page, pageSize, search, syncSearchParams, viewMode]);

  const fetchData = useCallback(async () => {
    const fetchId = latestFetchIdRef.current + 1;
    latestFetchIdRef.current = fetchId;

    setLoading(true);
    setLoadError("");
    try {
      const res = await LEADS.FETCH_ALL();
      if (latestFetchIdRef.current !== fetchId) return;

      if (res?.data?.success) {
        setLeads(Array.isArray(res.data.data) ? res.data.data : []);
        setHasLoadedOnce(true);
      } else {
        setLeads([]);
        setLoadError(res?.data?.message || "Lead data could not be loaded.");
        toastRef.current({
          title: "Unable to load leads",
          description: res?.data?.message || "Lead data could not be loaded.",
        });
      }
    } catch (error) {
      if (latestFetchIdRef.current !== fetchId) return;

      console.error(error);
      setLeads([]);
      setLoadError("Lead data could not be loaded.");
      toastRef.current({
        title: "Unable to load leads",
        description: "Lead data could not be loaded.",
      });
    } finally {
      if (latestFetchIdRef.current === fetchId) {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const fetchQualifiers = async () => {
      try {
        const [products, customers, tags] = await Promise.all([
          QUALIFIERS.FETCH_ALL("product"),
          QUALIFIERS.FETCH_ALL("customer"),
          QUALIFIERS.FETCH_ALL("tag"),
        ]);

        setProductGroups(products?.data?.data || []);
        setCustomerGroups(customers?.data?.data || []);
        setTagsList(tags?.data?.data || []);
      } catch (error) {
        console.error("Failed to load qualifiers", error);
      }
    };

    const fetchUsers = async () => {
      if (!canEditLead) {
        setAssigneeList([]);
        return;
      }

      try {
        const res = await AUTH.GET_ASSIGNABLE_USERS();
        if (res?.status === 200) {
          const users = Array.isArray(res.data?.data) ? res.data.data : [];
          setAssigneeList(users.filter((user) => user.is_active));
        }
      } catch (error) {
        console.error("Failed to load users", error);
      }
    };

    fetchQualifiers();
    fetchUsers();
  }, [canEditLead]);

  useEffect(() => {
    if (!initialListId) return;
    setListFilter(String(initialListId));
    setViewMode("all");
    setPage(1);
  }, [initialListId]);

  useEffect(() => {
    if (!listFilter) return;
    const listStillExists = lists.some((list) => String(list.id) === String(listFilter));
    if (!listStillExists) {
      setListFilter("");
      setPage(1);
    }
  }, [listFilter, lists]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(event.target)) {
        setListMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedLeads = useMemo(() => sortLeadsNewestFirst(leads), [leads]);

  const filteredLeads = useMemo(() => {
    let data = [...sortedLeads];

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.trim().toLowerCase();
      data = data.filter((lead) => {
        const fullName = `${lead.fname || ""} ${lead.lname || ""}`.trim().toLowerCase();
        return (
          fullName.includes(query) ||
          String(lead.email || "").toLowerCase().includes(query) ||
          String(lead.mobile || lead.mobile_masked || "").toLowerCase().includes(query) ||
          String(lead.organization || "").toLowerCase().includes(query)
        );
      });
    }

    if (listFilter) {
      data = data.filter((lead) => String(lead.list_id) === String(listFilter));
    }

    if (viewMode === "unattended") {
      data = data.filter((lead) => !lead.assigned_to);
    }

    return data;
  }, [debouncedSearch, listFilter, sortedLeads, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage, page]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLeads.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredLeads, pageSize]);

  const stats = useMemo(
    () => ({
      total: leads.length,
      unattended: leads.filter((lead) => !lead.assigned_to).length,
      assigned: leads.filter((lead) => lead.assigned_to).length,
      hot: leads.filter((lead) =>
        lists.find((list) => String(list.id) === String(lead.list_id))?.name?.toLowerCase().includes("hot")
      ).length,
    }),
    [leads, lists]
  );

  const rangeStart = filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = filteredLeads.length === 0 ? 0 : Math.min(currentPage * pageSize, filteredLeads.length);

  const getListName = useCallback(
    (id) => lists.find((list) => String(list.id) === String(id))?.name || "-",
    [lists]
  );

  const activeListName = listFilter ? getListName(listFilter) || "Selected List" : "All Lists";
  const appliedFilterLabel = useMemo(() => {
    if (search.trim()) return `Search Result: ${search.trim()}`;
    if (listFilter) {
      return activeListName.toLowerCase().includes("hot") ? "Hot Leads" : `List: ${activeListName}`;
    }
    if (viewMode === "unattended") return "Unattended Leads";
    return "All Leads";
  }, [activeListName, listFilter, search, viewMode]);
  const showInitialSkeleton = loading && !hasLoadedOnce;
  const showRefreshIndicator = loading && hasLoadedOnce;
  const isLightTheme = theme === "light";
  const productGroupOptions = useMemo(
    () => [{ value: "", label: "Select" }, ...productGroups.map((group) => ({ value: group.name, label: group.name }))],
    [productGroups]
  );
  const customerGroupOptions = useMemo(
    () => [{ value: "", label: "Select" }, ...customerGroups.map((group) => ({ value: group.name, label: group.name }))],
    [customerGroups]
  );
  const assigneeOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...assigneeList.map((assignee) => ({
        value: assignee.id,
        label: assignee.username || assignee.email || "Unknown user",
      })),
    ],
    [assigneeList]
  );
  const leadPotentialOptions = useMemo(
    () => [
      { value: "", label: "Select" },
      { value: "Low", label: "Low" },
      { value: "Medium", label: "Medium" },
      { value: "High", label: "High" },
    ],
    []
  );
  const leadStageOptions = useMemo(
    () => [
      { value: "", label: "Select" },
      { value: "Open", label: "Open" },
      { value: "Contacted", label: "Contacted" },
      { value: "Qualified", label: "Qualified" },
      { value: "Lost", label: "Lost" },
    ],
    []
  );
  const shellClassName = isLightTheme ? "min-h-screen bg-transparent p-6 text-slate-900" : "min-h-screen bg-[#0b0d10] p-6 text-white";
  const subtleTextClassName = isLightTheme ? "text-slate-500" : "text-gray-400";
  const panelClassName = isLightTheme ? "rounded-xl border border-black/10 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.22)]" : "rounded-xl border border-white/10 bg-black/20";
  const statCardClassName = isLightTheme ? "rounded-xl border border-black/10 bg-white px-4 py-3 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)]" : "rounded-xl border border-white/10 bg-black/40 px-4 py-3";
  const inputClassName = isLightTheme ? "h-9 border-black/10 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400" : "h-9 border-white/10 bg-black/50 pl-9 text-sm";
  const selectButtonClassName = isLightTheme ? "flex h-9 min-w-[160px] items-center justify-between gap-3 rounded-md border border-black/10 bg-white px-3 text-sm text-slate-900" : "flex h-9 min-w-[160px] items-center justify-between gap-3 rounded-md border border-white/10 bg-black/50 px-3 text-sm text-white";
  const segmentedClassName = isLightTheme ? "flex rounded-md border border-black/10 bg-white" : "flex rounded-md bg-black/40";
  const paginationClassName = isLightTheme ? "flex flex-col gap-4 rounded-xl border border-black/10 bg-white px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between" : "flex flex-col gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/75 md:flex-row md:items-center md:justify-between";
  const dialogClassName = isLightTheme
    ? "w-full max-w-2xl rounded-2xl border border-black/10 bg-[#fffdfa] p-6 text-slate-900 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)]"
    : "w-full max-w-2xl rounded-2xl border border-white/10 bg-black/90 p-6 text-white";
  const detailDialogClassName = isLightTheme
    ? "w-[min(1100px,calc(100vw-2rem))] max-h-[min(90vh,860px)] overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(180deg,#fffdfa_0%,#fff7e7_100%)] p-0 text-slate-900 shadow-[0_30px_120px_-42px_rgba(15,23,42,0.4)]"
    : "w-[min(1100px,calc(100vw-2rem))] max-h-[min(90vh,860px)] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.98)_0%,rgba(7,7,7,0.98)_100%)] p-0 text-white shadow-[0_30px_120px_-42px_rgba(0,0,0,0.9)]";
  const editDialogClassName = isLightTheme
    ? "w-[min(1160px,calc(100vw-2rem))] max-h-[min(92vh,920px)] overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(180deg,#fffdfa_0%,#fff7e7_100%)] p-0 text-slate-900 shadow-[0_32px_120px_-42px_rgba(15,23,42,0.42)]"
    : "w-[min(1160px,calc(100vw-2rem))] max-h-[min(92vh,920px)] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.99)_0%,rgba(6,6,6,0.99)_100%)] p-0 text-white shadow-[0_32px_120px_-42px_rgba(0,0,0,0.92)]";
  const dialogLabelClassName = isLightTheme
    ? "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
    : "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55";
  const dialogValueClassName = isLightTheme ? "mt-2 text-sm leading-6 text-slate-900" : "mt-2 text-sm leading-6 text-white/90";
  const dialogFieldClassName = isLightTheme
    ? "rounded-xl border border-black/10 bg-[#fffaf0] px-4 py-3 shadow-sm"
    : "rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3";
  const dialogInputClassName = isLightTheme
    ? "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/15"
    : "mt-1 w-full rounded border border-white/10 bg-black px-3 py-2 text-white";
  const dialogSecondaryButtonClassName = isLightTheme
    ? "border border-black/10 bg-white text-slate-900 hover:bg-slate-50"
    : "border border-white/15 bg-transparent text-white hover:bg-white/5";
  const detailSectionClassName = isLightTheme
    ? "rounded-[24px] border border-black/10 bg-white/80 p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.35)] backdrop-blur"
    : "rounded-[24px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur";
  const detailMetricClassName = isLightTheme
    ? "rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-4 shadow-sm"
    : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4";
  const detailMiniLabelClassName = isLightTheme
    ? "text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500"
    : "text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45";
  const detailMiniValueClassName = isLightTheme
    ? "mt-2 text-sm font-medium text-slate-900"
    : "mt-2 text-sm font-medium text-white";
  const detailIconWrapClassName = isLightTheme
    ? "flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#a67c00] shadow-sm"
    : "flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#f1d27a]";
  const detailTagClassName = isLightTheme
    ? "rounded-full border border-[#d4af37]/35 bg-[#fff7df] px-3 py-1 text-xs font-medium text-[#7a5c00]"
    : "rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#f4dd96]";
  const editInputShellClassName = isLightTheme
    ? "mt-3 flex h-12 items-center rounded-2xl border border-black/10 bg-white px-4 shadow-sm transition focus-within:border-[#D4AF37]/50 focus-within:ring-4 focus-within:ring-[#D4AF37]/10"
    : "mt-3 flex h-12 items-center rounded-2xl border border-white/10 bg-black/40 px-4 transition focus-within:border-[#D4AF37]/40 focus-within:ring-4 focus-within:ring-[#D4AF37]/10";
  const editTextAreaShellClassName = isLightTheme
    ? "mt-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition focus-within:border-[#D4AF37]/50 focus-within:ring-4 focus-within:ring-[#D4AF37]/10"
    : "mt-3 rounded-2xl border border-white/10 bg-black/40 p-4 transition focus-within:border-[#D4AF37]/40 focus-within:ring-4 focus-within:ring-[#D4AF37]/10";
  const editSelectShellClassName = isLightTheme
    ? "mt-3 flex h-12 items-center rounded-2xl border border-black/10 bg-white px-4 shadow-sm transition focus-within:border-[#D4AF37]/50 focus-within:ring-4 focus-within:ring-[#D4AF37]/10"
    : "mt-3 flex h-12 items-center rounded-2xl border border-white/10 bg-black/40 px-4 transition focus-within:border-[#D4AF37]/40 focus-within:ring-4 focus-within:ring-[#D4AF37]/10";
  const editPickerShellClassName = isLightTheme
    ? "mt-3 flex h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 shadow-sm transition focus-within:border-[#D4AF37]/50 focus-within:ring-4 focus-within:ring-[#D4AF37]/10"
    : "mt-3 flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 transition focus-within:border-[#D4AF37]/40 focus-within:ring-4 focus-within:ring-[#D4AF37]/10";
  const editControlClassName = isLightTheme
    ? "w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
    : "w-full border-0 bg-transparent p-0 text-sm text-white outline-none placeholder:text-white/35";
  const editPickerControlClassName = isLightTheme
    ? "crm-picker w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none"
    : "crm-picker w-full border-0 bg-transparent p-0 text-sm text-white outline-none";
  const controlIconClassName = isLightTheme ? "h-4 w-4 text-slate-400" : "h-4 w-4 text-white/45";
  const editSelectTriggerTextClassName = isLightTheme ? "truncate text-left text-sm text-slate-900" : "truncate text-left text-sm text-white";
  const editSelectMenuClassName = isLightTheme
    ? "max-h-72 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 text-slate-900 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]"
    : "max-h-72 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-2 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]";
  const editCheckboxCardClassName = isLightTheme
    ? "flex items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4 shadow-sm"
    : "flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-4";
  const editTagChooserClassName = isLightTheme
    ? "mt-3 grid max-h-56 grid-cols-1 gap-3 overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-2"
    : "mt-3 grid max-h-56 grid-cols-1 gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4 md:grid-cols-2";
  const editTagItemClassName = isLightTheme
    ? "flex items-center gap-3 rounded-xl border border-black/10 bg-[#fffdf8] px-3 py-3 text-sm text-slate-700 transition hover:border-[#D4AF37]/35 hover:bg-[#fff7e7]"
    : "flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/85 transition hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/[0.06]";

  const getPotentialClass = (potential) => {
    if (!potential) return "bg-white/5 text-white";
    if (potential === "High") return "bg-red-600 text-white";
    if (potential === "Medium") return "bg-yellow-400 text-black";
    if (potential === "Low") return "bg-green-500 text-white";
    return "bg-white/5 text-white";
  };

  const getStageClass = (stage) => {
    if (!stage) return "bg-white/5 text-white";
    if (stage === "Open") return "bg-blue-500 text-white";
    if (stage === "Contacted") return "bg-indigo-500 text-white";
    if (stage === "Qualified") return "bg-green-600 text-white";
    if (stage === "Lost") return "bg-gray-600 text-white";
    return "bg-white/5 text-white";
  };

  const updateSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const updateListFilter = (value) => {
    setListFilter(value);
    setPage(1);
  };

  const updateViewMode = (value) => {
    setViewMode(value);
    setPage(1);
  };

  const updatePageSize = (value) => {
    const parsed = Number(value);
    setPageSize(PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : PAGE_SIZE_OPTIONS[0]);
    setPage(1);
  };

  const openDeleteDialog = (lead) => {
    setLeadPendingDelete(lead);
    setDeleteDialogOpen(true);
    setMoreOpenId(null);
  };

  const handleDeleteLead = async () => {
    if (!leadPendingDelete?.id || leadDeleteLoading) return;
    if (!canDeleteLead) return;

    setLeadDeleteLoading(true);
    try {
      const res = await LEADS.DELETE(leadPendingDelete.id);
      if (res?.status === 200) {
        setDeleteDialogOpen(false);
        setLeadPendingDelete(null);
        await fetchData();
        onLeadDeleted?.(leadPendingDelete.id);
        toast({
          title: "Lead deleted",
          description: "The lead was removed successfully.",
        });
        return;
      }

      toast({
        title: "Delete failed",
        description: res?.data?.message || "Unable to delete the lead.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Delete failed",
        description: "Unable to delete the lead.",
      });
    } finally {
      setLeadDeleteLoading(false);
    }
  };

  const handleViewLead = async (id) => {
    try {
      const res = await LEADS.GET_BY_ID(id);
      if (res?.status === 200 && res.data?.data) {
        setSelectedLead(res.data.data);
        setViewDialogOpen(true);
      } else {
        toast({
          title: "Unable to open lead",
          description: "Lead details could not be loaded.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to open lead",
        description: "Lead details could not be loaded.",
      });
    }
  };

  const handleEditLead = async (id) => {
    if (!canEditLead) return;
    try {
      const res = await LEADS.GET_BY_ID(id);
      if (res?.status !== 200 || !res.data?.data) {
        toast({
          title: "Unable to edit lead",
          description: "Lead details could not be loaded.",
        });
        return;
      }

      const lead = res.data.data;
      const followUpRaw = lead.follow_up_date || lead.followUpDate || null;
      let followUpDate = "";
      let followUpTime = "";

      if (followUpRaw) {
        const date = new Date(followUpRaw);
        if (!Number.isNaN(date.getTime())) {
          followUpDate = date.toISOString().slice(0, 10);
          followUpTime = date.toISOString().slice(11, 16);
        }
      }

      setSelectedLead({
        ...lead,
        tags: lead.tags || [],
        followUpDate,
        followUpTime,
        repeatFollowUp: lead.repeat_follow_up || lead.repeatFollowUp || false,
        repeatInterval: lead.repeat_interval || lead.repeatInterval || "",
        followUpNotes: lead.follow_up_notes || lead.followUpNotes || "",
      });
      setEditDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to edit lead",
        description: "Lead details could not be loaded.",
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
    if (!canEditLead) return;
    if (!selectedLead.fname || !selectedLead.mobile) {
      toast({
        title: "Missing required fields",
        description: "First name and mobile are required.",
      });
      return;
    }

    setDialogSaving(true);
    try {
      const payload = {
        fname: selectedLead.fname,
        lname: selectedLead.lname,
        designation: selectedLead.designation,
        organization: selectedLead.organization,
        email: selectedLead.email,
        mobile: selectedLead.mobile,
        tel1: selectedLead.tel1,
        tel2: selectedLead.tel2,
        website: selectedLead.website,
        address: selectedLead.address,
        notes: selectedLead.notes,
        productGroup: selectedLead.product_group || selectedLead.productGroup || null,
        customerGroup: selectedLead.customer_group || selectedLead.customerGroup || null,
        tags: selectedLead.tags || [],
        dealSize: selectedLead.deal_size || selectedLead.dealSize || null,
        leadPotential: selectedLead.lead_potential || selectedLead.leadPotential || null,
        leadStage: selectedLead.lead_stage || selectedLead.leadStage || null,
        assignedTo: selectedLead.assigned_to || selectedLead.assignedTo || null,
        followUpDate: selectedLead.followUpDate || null,
        followUpTime: selectedLead.followUpTime || null,
        followUpNotes: selectedLead.followUpNotes || null,
        repeatFollowUp: selectedLead.repeatFollowUp || false,
        repeatInterval: selectedLead.repeatInterval || null,
      };

      const res = await LEADS.UPDATE(selectedLead.id, payload);
      if (res?.status === 200 && res.data?.success) {
        setEditDialogOpen(false);
        setSelectedLead(null);
        await fetchData();
        toast({
          title: "Lead updated",
          description: "Changes were saved successfully.",
        });
      } else {
        toast({
          title: "Update failed",
          description: res?.data?.message || "Unable to save lead changes.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Update failed",
        description: "Unable to save lead changes.",
      });
    } finally {
      setDialogSaving(false);
    }
  };

  const handleExportLeads = async () => {
    if (exporting) return;
    if (!canExportLeads) {
      toast({
        title: "Access denied",
        description: "You do not have permission to export leads.",
      });
      return;
    }
    if (!filteredLeads.length) {
      toast({
        title: "No leads available to export.",
        description: "Adjust your filters or add leads before exporting.",
      });
      return;
    }

    setExporting(true);
    try {
      await exportLeadsReport({
        leads: filteredLeads,
        lists,
        generatedBy: user?.name || user?.username || user?.email || "Admin",
        appliedFilter: appliedFilterLabel,
      });

      toast({
        title: "Export complete",
        description: `${filteredLeads.length} lead${filteredLeads.length === 1 ? "" : "s"} exported successfully.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Unable to generate the Excel file.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={shellClassName}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Manage Leads</h1>
            <p className={`text-sm ${subtleTextClassName}`}>
              {listFilter ? `Showing leads for ${activeListName}` : `${stats.total} total leads`}
            </p>
          </div>

          <div className="flex gap-2">
            {showRefreshIndicator ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-xs text-[#D4AF37]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Refreshing
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className={isLightTheme ? "border-black/10 bg-white text-slate-900 hover:bg-slate-50" : "border-white/10 bg-black/40 text-white hover:bg-white/5"}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {canExportLeads ? (
              <Button
                type="button"
                size="sm"
                className="gold-btn"
                onClick={handleExportLeads}
                disabled={exporting}
              >
                <Download className={`mr-1 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
                {exporting ? "Exporting..." : "Export"}
              </Button>
            ) : null}
          </div>
        </div>

        {showInitialSkeleton ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))}
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="flex-1">
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg xl:w-48" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>

            <TableSkeleton rows={9} columns={5} />
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total", stats.total],
                ["Unattended", stats.unattended],
                ["Assigned", stats.assigned],
                ["Hot", stats.hot],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={statCardClassName}
                >
                  <p className={`text-xs ${subtleTextClassName}`}>{label}</p>
                  <p className="text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  className={inputClassName}
                  placeholder="Search name, email, phone or organization"
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                />
              </div>

              <div ref={listDropdownRef} className="relative min-w-[160px]">
                <button
                  type="button"
                  onClick={() => setListMenuOpen((prev) => !prev)}
                  className={selectButtonClassName}
                >
                  <span className="truncate">{activeListName}</span>
                  <ChevronDown
                    className={`h-4 w-4 ${isLightTheme ? "text-slate-500" : "text-white/70"} transition-transform ${
                      listMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {listMenuOpen ? (
                  <div className={`absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl shadow-2xl ${isLightTheme ? "border border-black/10 bg-white" : "border border-white/10 bg-[#111317]"}`}>
                    <div className="max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          updateListFilter("");
                          setListMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                          listFilter === ""
                            ? "bg-[#1b6fd8] text-white"
                            : isLightTheme ? "text-slate-700 hover:bg-slate-50" : "text-white/85 hover:bg-white/5"
                        }`}
                      >
                        All Lists
                      </button>
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          type="button"
                          onClick={() => {
                            updateListFilter(String(list.id));
                            setListMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                            String(listFilter) === String(list.id)
                              ? "bg-[#1b6fd8] text-white"
                              : isLightTheme ? "text-slate-700 hover:bg-slate-50" : "text-white/85 hover:bg-white/5"
                          }`}
                        >
                          <span className="block truncate">{list.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={segmentedClassName}>
                <button
                  type="button"
                  onClick={() => updateViewMode("all")}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === "all" ? "bg-gold text-black" : isLightTheme ? "text-slate-500" : "text-gray-400"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => updateViewMode("unattended")}
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === "unattended" ? "bg-gold text-black" : isLightTheme ? "text-slate-500" : "text-gray-400"
                  }`}
                >
                  Unattended
                </button>
              </div>
            </div>

            {loadError && leads.length === 0 ? (
              <ErrorState
                title="Unable to load leads"
                description={loadError}
                onRetry={fetchData}
              />
            ) : (
              <>
                <div className={panelClassName}>
                  <div className={`grid gap-3 px-4 py-4 text-sm md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] ${isLightTheme ? "border-b border-black/10 text-slate-500" : "border-b border-white/5 text-white/75"}`}>
                    <div>Lead</div>
                    <div>Contact</div>
                    <div>Organization</div>
                    <div>List</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {paginatedLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`grid gap-3 px-4 py-4 text-sm transition-colors md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto] ${isLightTheme ? "border-t border-black/10 hover:bg-slate-50" : "border-t border-white/5 hover:bg-white/5"}`}
                    >
                      <div className="min-w-0 font-medium">
                        <div className="truncate">{`${lead.fname || ""} ${lead.lname || ""}`.trim() || "-"}</div>
                        <div className={`mt-1 flex items-center text-xs ${subtleTextClassName}`}>
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDateOnly(lead.created_at || lead.createdAt)}
                        </div>
                      </div>

                      <div className="min-w-0 space-y-1 text-xs">
                        <div className="truncate">{canViewLeadPhone ? lead.mobile || "-" : lead.mobile_masked || "Restricted"}</div>
                        <div className={`truncate ${subtleTextClassName}`}>{lead.email || "-"}</div>
                      </div>

                      <div className="min-w-0 text-xs">{lead.organization || "-"}</div>

                      <div className="min-w-0">
                        <span className={`inline-flex max-w-full truncate rounded px-2 py-0.5 text-xs ${isLightTheme ? "bg-slate-100 text-slate-700" : "bg-white/10"}`}>
                          {getListName(lead.list_id)}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleViewLead(lead.id)}
                          className={isLightTheme ? "px-2 py-2 text-slate-700 hover:bg-slate-100" : "px-2 py-2 text-white/80 hover:bg-white/5"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canDeleteLead ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="px-2 py-2 text-red-400 hover:bg-red-500/10"
                            onClick={() => openDeleteDialog(lead)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}

                        {canEditLead ? (
                          <div className="relative">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => setMoreOpenId(moreOpenId === lead.id ? null : lead.id)}
                              className={isLightTheme ? "px-2 py-2 text-slate-700 hover:bg-slate-100" : "px-2 py-2 text-white/80 hover:bg-white/5"}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {moreOpenId === lead.id ? (
                              <div className={`absolute right-0 z-50 mt-2 w-28 rounded-md p-2 ${isLightTheme ? "border border-black/10 bg-white shadow-lg" : "border border-white/10 bg-black/90"}`}>
                                <button
                                  type="button"
                                  className={isLightTheme ? "w-full rounded p-2 text-left text-sm text-slate-800 hover:bg-slate-50" : "w-full rounded p-2 text-left text-sm hover:bg-white/5"}
                                  onClick={() => {
                                    setMoreOpenId(null);
                                    handleEditLead(lead.id);
                                  }}
                                >
                                  Edit
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredLeads.length === 0 ? (
                  <EmptyState
                    title="No leads found"
                    description="Adjust your search or filters to find matching leads."
                  />
                ) : null}

                {filteredLeads.length > 0 ? (
                  <div className={paginationClassName}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                      <span>{`Showing ${rangeStart}-${rangeEnd} of ${filteredLeads.length} leads`}</span>
                      <label className="flex items-center gap-2">
                        <span className={isLightTheme ? "text-slate-500" : "text-white/60"}>Rows</span>
                        <select
                          value={pageSize}
                          onChange={(event) => updatePageSize(event.target.value)}
                          className={isLightTheme ? "rounded-md border border-black/10 bg-white px-3 py-2 text-slate-900 focus:outline-none" : "rounded-md border border-white/10 bg-black/50 px-3 py-2 text-white focus:outline-none"}
                        >
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span>{`Page ${currentPage} of ${totalPages}`}</span>
                      <Button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={isLightTheme ? "border border-black/10 bg-white px-4 py-2 text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" : "border border-white/10 bg-white/[0.03] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={isLightTheme ? "border border-black/10 bg-white px-4 py-2 text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" : "border border-white/10 bg-white/[0.03] px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open && !leadDeleteLoading) setLeadPendingDelete(null);
          }}
          title="Delete Lead?"
          description="This action cannot be undone. Are you sure you want to delete this lead?"
          details={
            leadPendingDelete ? (
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {`${leadPendingDelete.fname || ""} ${leadPendingDelete.lname || ""}`.trim() || "Unnamed lead"}
                </div>
                <div className="text-white/60">{leadPendingDelete.email || (canViewLeadPhone ? leadPendingDelete.mobile : "Restricted") || "-"}</div>
              </div>
            ) : null
          }
          cancelLabel="Cancel"
          confirmLabel="Delete"
          onConfirm={handleDeleteLead}
          loading={leadDeleteLoading}
          destructive
        />

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className={detailDialogClassName}>
            <div className="overflow-y-auto max-h-[min(90vh,860px)]">
              <div className={isLightTheme ? "border-b border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,231,0.96))] p-6 md:p-8" : "border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_30%),linear-gradient(135deg,rgba(20,20,20,0.98),rgba(8,8,8,0.98))] p-6 md:p-8"}>
                <DialogHeader className="mb-0">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "border-black/10 bg-white/75 text-slate-500" : "border-white/10 bg-white/[0.05] text-white/55"}`}>
                        <Eye className="h-3.5 w-3.5" />
                        Lead Details
                      </div>

                      <div className="space-y-2">
                        <DialogTitle className={`text-2xl font-semibold tracking-tight md:text-3xl ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                          {selectedLead ? `${selectedLead.fname || ""} ${selectedLead.lname || ""}`.trim() || "Unnamed lead" : "Lead"}
                        </DialogTitle>
                        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${isLightTheme ? "text-slate-600" : "text-white/65"}`}>
                          <span className="inline-flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {selectedLead?.organization || "No organization"}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            {getListName(selectedLead?.list_id) || "No list"}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Created {formatDateOnly(selectedLead?.created_at || selectedLead?.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:max-w-[40%] lg:justify-end">
                      {(selectedLead?.lead_potential || selectedLead?.leadPotential) ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            getPotentialClass(selectedLead?.lead_potential || selectedLead?.leadPotential)
                          }`}
                        >
                          {selectedLead?.lead_potential || selectedLead?.leadPotential}
                        </span>
                      ) : null}

                      {(selectedLead?.lead_stage || selectedLead?.leadStage) ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            getStageClass(selectedLead?.lead_stage || selectedLead?.leadStage)
                          }`}
                        >
                          {selectedLead?.lead_stage || selectedLead?.leadStage}
                        </span>
                      ) : null}

                      <span className={`${isLightTheme ? "border-black/10 bg-white/80 text-slate-700" : "border-white/10 bg-white/[0.05] text-white/75"} inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium`}>
                        <Users className="h-3.5 w-3.5" />
                        {selectedLead?.assignee_name || selectedLead?.assignee_email || selectedLead?.assigned_to || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className={detailMetricClassName}>
                    <div className={detailMiniLabelClassName}>Next follow-up</div>
                    <div className={detailMiniValueClassName}>
                      {formatDateTime(selectedLead?.follow_up_date || selectedLead?.followUpDate)}
                    </div>
                  </div>
                  <div className={detailMetricClassName}>
                    <div className={detailMiniLabelClassName}>Follow-up cadence</div>
                    <div className={detailMiniValueClassName}>
                      {selectedLead?.repeat_follow_up || selectedLead?.repeatFollowUp ? "Repeating follow-up" : "One-time follow-up"}
                    </div>
                  </div>
                  <div className={detailMetricClassName}>
                    <div className={detailMiniLabelClassName}>Follow-ups sent</div>
                    <div className={detailMiniValueClassName}>
                      {selectedLead?.follow_up_count ?? selectedLead?.followUpCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-5 p-6 md:p-8 xl:grid-cols-[1.15fr_0.85fr] ${isLightTheme ? "text-slate-900" : "text-white/90"}`}>
                <div className="space-y-5">
                  <section className={detailSectionClassName}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className={detailIconWrapClassName}>
                        <CircleUserRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Contact information</h3>
                        <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Core lead details and primary contact channels.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Full name</Label>
                        <div className={dialogValueClassName}>
                          {selectedLead ? `${selectedLead.fname || ""} ${selectedLead.lname || ""}`.trim() || "-" : "-"}
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Organization</Label>
                        <div className={dialogValueClassName}>{selectedLead?.organization || "-"}</div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Mobile</Label>
                        <div className={`${dialogValueClassName} inline-flex items-center gap-2`}>
                          <Phone className="h-4 w-4 opacity-60" />
                          <span>{canViewLeadPhone ? selectedLead?.mobile || "-" : selectedLead?.mobile_masked || "Restricted"}</span>
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Email</Label>
                        <div className={`${dialogValueClassName} inline-flex items-center gap-2 break-all`}>
                          <Mail className="h-4 w-4 shrink-0 opacity-60" />
                          <span>{selectedLead?.email || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={detailSectionClassName}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className={detailIconWrapClassName}>
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Pipeline overview</h3>
                        <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Assignment, segmentation, and conversion signals.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Assigned to</Label>
                        <div className={dialogValueClassName}>
                          {selectedLead?.assignee_name || selectedLead?.assignee_email || selectedLead?.assigned_to || "-"}
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Created</Label>
                        <div className={`${dialogValueClassName} inline-flex items-center gap-2`}>
                          <Calendar className="h-4 w-4 opacity-60" />
                          <span>{formatDateTime(selectedLead?.created_at || selectedLead?.createdAt)}</span>
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Product group</Label>
                        <div className={dialogValueClassName}>{selectedLead?.product_group || selectedLead?.productGroup || "-"}</div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Customer group</Label>
                        <div className={dialogValueClassName}>{selectedLead?.customer_group || selectedLead?.customerGroup || "-"}</div>
                      </div>
                    </div>

                    <div className={`mt-4 ${dialogFieldClassName}`}>
                      <Label className={dialogLabelClassName}>Tags</Label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedLead?.tags?.length ? (
                          selectedLead.tags.map((tagId) => (
                            <span key={tagId} className={detailTagClassName}>
                              {tagsList.find((tag) => tag.id === tagId)?.name || tagId}
                            </span>
                          ))
                        ) : (
                          <div className={dialogValueClassName}>-</div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-5">
                  <section className={detailSectionClassName}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className={detailIconWrapClassName}>
                        <CalendarClock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Follow-up plan</h3>
                        <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Upcoming activity and outreach guidance for this lead.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Next follow-up</Label>
                        <div className={dialogValueClassName}>
                          {formatDateTime(selectedLead?.follow_up_date || selectedLead?.followUpDate)}
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Follow-up status</Label>
                        <div className={dialogValueClassName}>
                          {selectedLead?.repeat_follow_up || selectedLead?.repeatFollowUp ? "Repeating sequence" : "One-time reminder"}
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Follow-up notes</Label>
                        <div className={`${dialogValueClassName} whitespace-pre-wrap`}>
                          {selectedLead?.follow_up_notes || selectedLead?.followUpNotes || "-"}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={detailSectionClassName}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className={detailIconWrapClassName}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Internal notes</h3>
                        <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Additional team context saved against this lead.</p>
                      </div>
                    </div>

                    <div className={dialogFieldClassName}>
                      <Label className={dialogLabelClassName}>Notes</Label>
                      <div className={`${dialogValueClassName} whitespace-pre-wrap`}>{selectedLead?.notes || "-"}</div>
                    </div>
                  </section>
                </div>
              </div>

              <DialogFooter className={`flex flex-col-reverse gap-3 border-t px-6 py-5 md:flex-row md:justify-end md:px-8 ${isLightTheme ? "border-black/10 bg-white/70" : "border-white/10 bg-black/40"}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewDialogOpen(false)}
                className={dialogSecondaryButtonClassName}
              >
                Close
              </Button>
              {canEditLead ? (
                <Button
                  type="button"
                  className="gold-btn"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEditLead(selectedLead?.id);
                  }}
                >
                  Edit
                </Button>
              ) : null}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen && canEditLead} onOpenChange={setEditDialogOpen}>
          <DialogContent className={editDialogClassName}>
            {selectedLead ? (
              <div className="overflow-y-auto max-h-[min(92vh,920px)]">
                <div className={isLightTheme ? "border-b border-black/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,231,0.96))] p-6 md:p-8" : "border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_30%),linear-gradient(135deg,rgba(20,20,20,0.98),rgba(8,8,8,0.98))] p-6 md:p-8"}>
                  <DialogHeader className="mb-0">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-4">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "border-black/10 bg-white/75 text-slate-500" : "border-white/10 bg-white/[0.05] text-white/55"}`}>
                          <FileText className="h-3.5 w-3.5" />
                          Edit Lead
                        </div>

                        <div className="space-y-2">
                          <DialogTitle className={`text-2xl font-semibold tracking-tight md:text-3xl ${isLightTheme ? "text-slate-900" : "text-white"}`}>
                            {`${selectedLead.fname || ""} ${selectedLead.lname || ""}`.trim() || "Lead record"}
                          </DialogTitle>
                          <p className={isLightTheme ? "text-sm text-slate-600" : "text-sm text-white/60"}>
                            Update lead identity, ownership, qualification, and follow-up details from one clean workspace.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[380px]">
                        <div className={detailMetricClassName}>
                          <div className={detailMiniLabelClassName}>List</div>
                          <div className={detailMiniValueClassName}>{getListName(selectedLead?.list_id) || "-"}</div>
                        </div>
                        <div className={detailMetricClassName}>
                          <div className={detailMiniLabelClassName}>Stage</div>
                          <div className={detailMiniValueClassName}>{selectedLead?.lead_stage || selectedLead?.leadStage || "Not set"}</div>
                        </div>
                        <div className={detailMetricClassName}>
                          <div className={detailMiniLabelClassName}>Potential</div>
                          <div className={detailMiniValueClassName}>{selectedLead?.lead_potential || selectedLead?.leadPotential || "Not set"}</div>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div className={`grid grid-cols-1 gap-5 p-6 md:p-8 xl:grid-cols-[1.1fr_0.9fr] ${isLightTheme ? "text-slate-900" : "text-white/90"}`}>
                  <div className="space-y-5">
                    <section className={detailSectionClassName}>
                      <div className="mb-5 flex items-center gap-3">
                        <div className={detailIconWrapClassName}>
                          <CircleUserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Contact details</h3>
                          <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Keep the lead identity and primary contact information accurate.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>First name</Label>
                          <div className={editInputShellClassName}>
                            <input
                              className={editControlClassName}
                              value={selectedLead.fname || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({ ...prev, fname: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Last name</Label>
                          <div className={editInputShellClassName}>
                            <input
                              className={editControlClassName}
                              value={selectedLead.lname || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({ ...prev, lname: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Mobile</Label>
                          <div className={editInputShellClassName}>
                            <input
                              className={editControlClassName}
                              value={selectedLead.mobile || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({ ...prev, mobile: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Email</Label>
                          <div className={editInputShellClassName}>
                            <input
                              className={editControlClassName}
                              value={selectedLead.email || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({ ...prev, email: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className={`mt-4 ${dialogFieldClassName}`}>
                        <Label className={dialogLabelClassName}>Organization</Label>
                        <div className={editInputShellClassName}>
                          <input
                            className={editControlClassName}
                            value={selectedLead.organization || ""}
                            onChange={(event) =>
                              setSelectedLead((prev) => ({ ...prev, organization: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </section>

                    <section className={detailSectionClassName}>
                      <div className="mb-5 flex items-center gap-3">
                        <div className={detailIconWrapClassName}>
                          <BadgeCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Qualification and ownership</h3>
                          <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Define where the lead sits in your pipeline and who owns it.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Product group</Label>
                          <div className="mt-3">
                            <EditSelect
                              value={selectedLead.product_group || selectedLead.productGroup || ""}
                              options={productGroupOptions}
                              onChange={(nextValue) =>
                                setSelectedLead((prev) => ({ ...prev, product_group: nextValue }))
                              }
                              shellClassName={`${editSelectShellClassName} mt-0 w-full justify-between`}
                              triggerClassName={editSelectTriggerTextClassName}
                              menuClassName={editSelectMenuClassName}
                              iconClassName={controlIconClassName}
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Customer group</Label>
                          <div className="mt-3">
                            <EditSelect
                              value={selectedLead.customer_group || selectedLead.customerGroup || ""}
                              options={customerGroupOptions}
                              onChange={(nextValue) =>
                                setSelectedLead((prev) => ({ ...prev, customer_group: nextValue }))
                              }
                              shellClassName={`${editSelectShellClassName} mt-0 w-full justify-between`}
                              triggerClassName={editSelectTriggerTextClassName}
                              menuClassName={editSelectMenuClassName}
                              iconClassName={controlIconClassName}
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Assign to</Label>
                          <div className="mt-3">
                            <EditSelect
                              value={selectedLead.assigned_to || selectedLead.assignedTo || ""}
                              options={assigneeOptions}
                              onChange={(nextValue) =>
                                setSelectedLead((prev) => ({ ...prev, assigned_to: nextValue }))
                              }
                              shellClassName={`${editSelectShellClassName} mt-0 w-full justify-between`}
                              triggerClassName={editSelectTriggerTextClassName}
                              menuClassName={editSelectMenuClassName}
                              iconClassName={controlIconClassName}
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Deal size (INR)</Label>
                          <div className={editInputShellClassName}>
                            <input
                              type="number"
                              className={editControlClassName}
                              value={selectedLead.deal_size || selectedLead.dealSize || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({ ...prev, deal_size: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Lead potential</Label>
                          <div className="mt-3">
                            <EditSelect
                              value={selectedLead.lead_potential || selectedLead.leadPotential || ""}
                              options={leadPotentialOptions}
                              onChange={(nextValue) =>
                                setSelectedLead((prev) => ({ ...prev, lead_potential: nextValue }))
                              }
                              shellClassName={`${editSelectShellClassName} mt-0 w-full justify-between`}
                              triggerClassName={editSelectTriggerTextClassName}
                              menuClassName={editSelectMenuClassName}
                              iconClassName={controlIconClassName}
                            />
                          </div>
                        </div>
                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Lead stage</Label>
                          <div className="mt-3">
                            <EditSelect
                              value={selectedLead.lead_stage || selectedLead.leadStage || ""}
                              options={leadStageOptions}
                              onChange={(nextValue) =>
                                setSelectedLead((prev) => ({ ...prev, lead_stage: nextValue }))
                              }
                              shellClassName={`${editSelectShellClassName} mt-0 w-full justify-between`}
                              triggerClassName={editSelectTriggerTextClassName}
                              menuClassName={editSelectMenuClassName}
                              iconClassName={controlIconClassName}
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-5">
                    <section className={detailSectionClassName}>
                      <div className="mb-5 flex items-center gap-3">
                        <div className={detailIconWrapClassName}>
                          <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Follow-up setup</h3>
                          <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Plan reminders, cadence, and context for the next touchpoint.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className={dialogFieldClassName}>
                            <Label className={dialogLabelClassName}>Follow-up date</Label>
                            <div className={editPickerShellClassName}>
                              <CalendarDays className={`${controlIconClassName} shrink-0`} />
                              <input
                                type="date"
                                className={editPickerControlClassName}
                                value={selectedLead.followUpDate || ""}
                                onChange={(event) =>
                                  setSelectedLead((prev) => ({
                                    ...prev,
                                    followUpDate: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className={dialogFieldClassName}>
                            <Label className={dialogLabelClassName}>Follow-up time</Label>
                            <div className={editPickerShellClassName}>
                              <Clock3 className={`${controlIconClassName} shrink-0`} />
                              <input
                                type="time"
                                className={editPickerControlClassName}
                                value={selectedLead.followUpTime || ""}
                                onChange={(event) =>
                                  setSelectedLead((prev) => ({
                                    ...prev,
                                    followUpTime: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className={editCheckboxCardClassName}>
                          <input
                            id="repeatFollowUp"
                            type="checkbox"
                            checked={selectedLead.repeatFollowUp || false}
                            onChange={(event) =>
                              setSelectedLead((prev) => ({
                                ...prev,
                                repeatFollowUp: event.target.checked,
                              }))
                            }
                            className="mt-1 h-4 w-4 accent-[#D4AF37]"
                          />
                          <label htmlFor="repeatFollowUp" className="space-y-1">
                            <div className={isLightTheme ? "text-sm font-medium text-slate-900" : "text-sm font-medium text-white"}>Repeat follow-up</div>
                            <div className={isLightTheme ? "text-xs text-slate-500" : "text-xs text-white/50"}>
                              Turn this on when the lead should stay in a recurring follow-up cycle.
                            </div>
                          </label>
                        </div>

                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Repeat interval</Label>
                          <div className={editInputShellClassName}>
                            <input
                              className={editControlClassName}
                              value={selectedLead.repeatInterval || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({
                                  ...prev,
                                  repeatInterval: event.target.value,
                                }))
                              }
                              placeholder="e.g., 7 days"
                            />
                          </div>
                        </div>

                        <div className={dialogFieldClassName}>
                          <Label className={dialogLabelClassName}>Follow-up notes</Label>
                          <div className={editTextAreaShellClassName}>
                            <textarea
                              className={`${editControlClassName} min-h-[140px] resize-none`}
                              value={selectedLead.followUpNotes || ""}
                              onChange={(event) =>
                                setSelectedLead((prev) => ({
                                  ...prev,
                                  followUpNotes: event.target.value,
                                }))
                              }
                              placeholder="Add any context for the next outreach."
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className={detailSectionClassName}>
                      <div className="mb-5 flex items-center gap-3">
                        <div className={detailIconWrapClassName}>
                          <Tags className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`text-base font-semibold ${isLightTheme ? "text-slate-900" : "text-white"}`}>Tags and notes</h3>
                          <p className={isLightTheme ? "text-sm text-slate-500" : "text-sm text-white/55"}>Use tags for segmentation and notes for internal team context.</p>
                        </div>
                      </div>

                      <div className={dialogFieldClassName}>
                        <Label className={dialogLabelClassName}>Tags</Label>
                        <div className={editTagChooserClassName}>
                          {tagsList.map((tag) => (
                            <label key={tag.id} className={editTagItemClassName}>
                              <input
                                type="checkbox"
                                checked={(selectedLead.tags || []).includes(tag.id)}
                                onChange={() => {
                                  setSelectedLead((prev) => {
                                    const alreadySelected = (prev.tags || []).includes(tag.id);
                                    const nextTags = alreadySelected
                                      ? prev.tags.filter((value) => value !== tag.id)
                                      : [...(prev.tags || []), tag.id];
                                    return { ...prev, tags: nextTags };
                                  });
                                }}
                                className="h-4 w-4 accent-[#D4AF37]"
                              />
                              <span>{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className={`mt-4 ${dialogFieldClassName}`}>
                        <Label className={dialogLabelClassName}>Notes</Label>
                        <div className={editTextAreaShellClassName}>
                          <textarea
                            className={`${editControlClassName} min-h-[140px] resize-none`}
                            value={selectedLead.notes || ""}
                            onChange={(event) =>
                              setSelectedLead((prev) => ({ ...prev, notes: event.target.value }))
                            }
                            placeholder="Add internal notes for your team."
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <DialogFooter className={`flex flex-col-reverse gap-3 border-t px-6 py-5 md:flex-row md:justify-end md:px-8 ${isLightTheme ? "border-black/10 bg-white/70" : "border-white/10 bg-black/40"}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedLead(null);
                }}
                className={dialogSecondaryButtonClassName}
              >
                Cancel
              </Button>
              <Button type="button" className="gold-btn" onClick={handleSaveEdit} disabled={dialogSaving}>
                {dialogSaving ? "Saving..." : "Save Changes"}
              </Button>
                </DialogFooter>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ManageLeads;
