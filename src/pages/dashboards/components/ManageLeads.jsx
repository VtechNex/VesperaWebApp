import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Phone,
  Mail,
  Building,
  Calendar,
  User,
  Filter,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  UserCheck,
  Clock,
  Tag,
  ChevronDown,
} from "lucide-react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import LEADS from "../../../services/leadService";
import QUALIFIERS from "../../../services/qualifierService";

function ManageLeads({ lists = [], initialViewMode }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [viewMode, setViewMode] = useState(initialViewMode || "all");
  const [loading, setLoading] = useState(false);

  // Dialog & qualifiers state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [productGroups, setProductGroups] = useState([]);
  const [customerGroups, setCustomerGroups] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [moreOpenId, setMoreOpenId] = useState(null);
  const [dialogSaving, setDialogSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await LEADS.FETCH_ALL();
    if (res?.data?.success) setLeads(res.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    // also fetch qualifiers for edit/view
    const fetchQualifiers = async () => {
      try {
        const p = await QUALIFIERS.FETCH_ALL('product');
        const c = await QUALIFIERS.FETCH_ALL('customer');
        const t = await QUALIFIERS.FETCH_ALL('tag');
        setProductGroups(p?.data?.data || []);
        setCustomerGroups(c?.data?.data || []);
        setTagsList(t?.data?.data || []);
      } catch (err) {
        console.error('Failed to load qualifiers', err);
      }
    };

    fetchQualifiers();
  }, [fetchData]);

  const filteredLeads = useMemo(() => {
    let data = [...leads];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          `${l.fname || ""} ${l.lname || ""}`.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.mobile?.includes(q)
      );
    }

    if (listFilter) {
      data = data.filter((l) => String(l.list_id) === listFilter);
    }

    if (viewMode === "unattended") {
      // Show leads that are in Open stage only (case-insensitive)
      data = data.filter((l) => {
        const stage = (l.lead_stage || l.leadStage || '').toString().toLowerCase();
        return stage === 'Open';
      });
    }

    return data;
  }, [leads, search, listFilter, viewMode]);

  const stats = {
    total: leads.length,
    unattended: leads.filter((l) => !l.assigned_to).length,
    assigned: leads.filter((l) => l.assigned_to).length,
    hot: leads.filter((l) =>
      lists.find((x) => x.id === l.list_id)?.name?.toLowerCase().includes("hot")
    ).length,
  };

  const getListName = (id) =>
    lists.find((l) => String(l.id) === String(id))?.name || "—";

  const getPotentialClass = (p) => {
    if (!p) return 'bg-white/5 text-white';
    if (p === 'High') return 'bg-red-600 text-white';
    if (p === 'Medium') return 'bg-yellow-400 text-black';
    if (p === 'Low') return 'bg-green-500 text-white';
    return 'bg-white/5 text-white';
  };

  const getStageClass = (s) => {
    if (!s) return 'bg-white/5 text-white';
    if (s === 'Open') return 'bg-blue-500 text-white';
    if (s === 'Contacted') return 'bg-indigo-500 text-white';
    if (s === 'Qualified') return 'bg-green-600 text-white';
    if (s === 'Lost') return 'bg-gray-600 text-white';
    return 'bg-white/5 text-white';
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      const res = await LEADS.DELETE(id);
      if (res?.status === 200) {
        await fetchData();
      } else {
        window.alert('Delete failed');
      }
    } catch (err) {
      console.error(err);
      window.alert('Delete failed');
    }
  };

  const handleViewLead = async (id) => {
    try {
      const res = await LEADS.GET_BY_ID(id);
      if (res?.status === 200 && res.data?.data) {
        setSelectedLead(res.data.data);
        setViewDialogOpen(true);
      } else {
        window.alert('Failed to fetch lead');
      }
    } catch (err) {
      console.error(err);
      window.alert('Failed to fetch lead');
    }
  };

  const handleEditLead = async (id) => {
    try {
      const res = await LEADS.GET_BY_ID(id);
      if (res?.status === 200 && res.data?.data) {
        // copy to editable object
        setSelectedLead({ ...res.data.data, tags: res.data.data.tags || [] });
        setEditDialogOpen(true);
      } else {
        window.alert('Failed to fetch lead');
      }
    } catch (err) {
      console.error(err);
      window.alert('Failed to fetch lead');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedLead) return;
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
      };

      const res = await LEADS.UPDATE(selectedLead.id, payload);
      if (res?.status === 200 && res.data?.success) {
        setEditDialogOpen(false);
        setSelectedLead(null);
        await fetchData();
      } else {
        window.alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      window.alert('Update failed');
    } finally {
      setDialogSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Manage Leads</h1>
            <p className="text-sm text-gray-400">
              {stats.total} total leads
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" className="gold-btn">
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            ["Total", stats.total],
            ["Unattended", stats.unattended],
            ["Assigned", stats.assigned],
            ["Hot", stats.hot],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border border-white/10 rounded-lg px-4 py-3 bg-black/40"
            >
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 h-9 text-sm bg-black/50 border-white/10"
              placeholder="Search name, email or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="h-9 bg-black/50 border border-white/10 rounded-md px-3 text-sm"
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
          >
            <option value="">All Lists</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <div className="flex bg-black/40 rounded-md">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "all" ? "bg-gold text-black" : "text-gray-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode("unattended")}
              className={`px-3 py-1.5 text-sm ${
                viewMode === "unattended"
                  ? "bg-gold text-black"
                  : "text-gray-400"
              }`}
            >
              Unattended
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 text-xs text-gray-400 bg-black/60">
            <div className="col-span-3">Lead</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-2">Organization</div>
            <div className="col-span-2">List</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="grid grid-cols-12 px-4 py-3 text-sm border-t border-white/5 hover:bg-white/5"
            >
              <div className="col-span-3 font-medium">
                {lead.fname} {lead.lname}
                <div className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(lead.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="col-span-3 space-y-1 text-xs">
                {lead.mobile && <div>{lead.mobile}</div>}
                {lead.email && <div className="text-gray-400">{lead.email}</div>}
              </div>

              <div className="col-span-2 text-xs">
                {lead.organization || "—"}
              </div>

              <div className="col-span-2">
                <span className="px-2 py-0.5 text-xs rounded bg-white/10">
                  {getListName(lead.list_id)}
                </span>
              </div>

              <div className="col-span-2 flex justify-end gap-2 relative">
                <Button size="icon" variant="ghost" onClick={() => handleViewLead(lead.id)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-red-400" onClick={() => handleDeleteLead(lead.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>

                <div className="relative">
                  <Button size="icon" variant="ghost" onClick={() => setMoreOpenId(moreOpenId === lead.id ? null : lead.id)}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                  {moreOpenId === lead.id && (
                    <div className="absolute right-0 mt-2 bg-black/90 border border-white/10 rounded-md p-2 w-28 z-50">
                      <button className="w-full text-left text-sm p-2 hover:bg-white/5 rounded" onClick={() => { setMoreOpenId(null); handleEditLead(lead.id); }}>
                        Edit
                      </button>
                      {/* Future: other actions */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-10">
            No leads found
          </p>
        )}

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={(open) => setViewDialogOpen(open)}>
          <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-2xl w-full p-6">
            <DialogHeader className="flex items-start justify-between">
              <DialogTitle className="text-base md:text-lg font-semibold text-white">Lead Details</DialogTitle>

              <div className="flex items-center gap-2">
                {(selectedLead?.lead_potential || selectedLead?.leadPotential) && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPotentialClass(selectedLead?.lead_potential || selectedLead?.leadPotential)}`}>
                    {selectedLead?.lead_potential || selectedLead?.leadPotential}
                  </span>
                )}

                {(selectedLead?.lead_stage || selectedLead?.leadStage) && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStageClass(selectedLead?.lead_stage || selectedLead?.leadStage)}`}>
                    {selectedLead?.lead_stage || selectedLead?.leadStage}
                  </span>
                )}
              </div>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-white/90">
              <div>
                <Label>Full name</Label>
                <div className="mt-1">{selectedLead ? `${selectedLead.fname} ${selectedLead.lname || ''}` : '—'}</div>
              </div>

              <div>
                <Label>Mobile</Label>
                <div className="mt-1">{selectedLead?.mobile || '—'}</div>
              </div>

              <div>
                <Label>Email</Label>
                <div className="mt-1">{selectedLead?.email || '—'}</div>
              </div>

              <div>
                <Label>Organization</Label>
                <div className="mt-1">{selectedLead?.organization || '—'}</div>
              </div>

              <div>
                <Label>List</Label>
                <div className="mt-1">{getListName(selectedLead?.list_id) || '—'}</div>
              </div>

              <div>
                <Label>Created</Label>
                <div className="mt-1">{selectedLead ? new Date(selectedLead.created_at).toLocaleString() : '—'}</div>
              </div>

              <div>
                <Label>Product Group</Label>
                <div className="mt-1">{selectedLead?.product_group || selectedLead?.productGroup || '—'}</div>
              </div>

              <div>
                <Label>Customer Group</Label>
                <div className="mt-1">{selectedLead?.customer_group || selectedLead?.customerGroup || '—'}</div>
              </div>

              <div className="col-span-2">
                <Label>Tags</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedLead?.tags && selectedLead.tags.length ? (
                    (selectedLead.tags || []).map((tid) => (
                      <span key={tid} className="px-2 py-0.5 rounded bg-white/10 text-xs">{tagsList.find(t=>t.id===tid)?.name || tid}</span>
                    ))
                  ) : (
                    <div>—</div>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <Label>Notes</Label>
                <div className="mt-1 whitespace-pre-wrap">{selectedLead?.notes || '—'}</div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              <Button className="gold-btn" onClick={() => { setViewDialogOpen(false); handleEditLead(selectedLead?.id); }}>Edit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => setEditDialogOpen(open)}>
          <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-2xl w-full p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg font-semibold text-white">Edit Lead</DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <div className="mt-4 space-y-4 text-sm text-white/90">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <input className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.fname || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, fname: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <input className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.lname || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, lname: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mobile</Label>
                    <input className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.mobile || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, mobile: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <input className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.email || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, email: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <Label>Organization</Label>
                  <input className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.organization || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, organization: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Product Group</Label>
                    <select className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.product_group || selectedLead.productGroup || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, product_group: e.target.value }))}>
                      <option value="">Select</option>
                      {productGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Customer Group</Label>
                    <select className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.customer_group || selectedLead.customerGroup || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, customer_group: e.target.value }))}>
                      <option value="">Select</option>
                      {customerGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-white/5 rounded">
                    {tagsList.map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={(selectedLead.tags || []).includes(t.id)} onChange={() => {
                          setSelectedLead(prev => {
                            const already = (prev.tags || []).includes(t.id);
                            const next = already ? prev.tags.filter(x => x !== t.id) : [...(prev.tags || []), t.id];
                            return {...prev, tags: next};
                          })
                        }} />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Deal Size (INR)</Label>
                    <input type="number" className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.deal_size || selectedLead.dealSize || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, deal_size: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Lead Potential</Label>
                    <select className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.lead_potential || selectedLead.leadPotential || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, lead_potential: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <Label>Lead Stage</Label>
                    <select className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.lead_stage || selectedLead.leadStage || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, lead_stage: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="Open">Open</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Qualified">Qualified</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <textarea className="w-full bg-black text-white border border-white/10 rounded px-3 py-2 mt-1" value={selectedLead.notes || ''} onChange={(e) => setSelectedLead(prev => ({ ...prev, notes: e.target.value }))} />
                </div>

              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedLead(null); }}>Cancel</Button>
              <Button className="gold-btn" onClick={handleSaveEdit} disabled={dialogSaving}>{dialogSaving ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ManageLeads;
