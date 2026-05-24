import React, { useState, useMemo, useEffect, useRef } from 'react'
import QUALIFIERS from '../../../../services/qualifierService'
import SETTINGS from '../../../../services/settingsService'
import { Input } from '../../../../components/ui/input'
import { Button } from '../../../../components/ui/button'
import { Label } from '../../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../../components/ui/dialog'
import ConfirmDialog from '../../../../components/ui/ConfirmDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'
import { useToast } from '../../../../hooks/use-toast'

function ManageQualifiers() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('product-groups')

  const listOptionsForCustomFields = [
    { id: 'heavy', label: 'HEAVY DEPOSIT' },
    { id: 'purchase', label: 'PURCHASE' },
    { id: 'purchase-req', label: 'PURCHASE - REQUIREMENT' },
    { id: 'rent', label: 'RENT' },
    { id: 'rent-req', label: 'RENT - REQUIREMENT' },
  ]

  const [groups, setGroups] = useState([])
  const [customerGroups, setCustomerGroups] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [customFields, setCustomFields] = useState([])

  const [search, setSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')

  const [sortBy, setSortBy] = useState('recent-created')
  const [customerSortBy, setCustomerSortBy] = useState('recent-created')
  const [tagSortBy, setTagSortBy] = useState('recent-created')

  const [tagsPage, setTagsPage] = useState(1)

  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editDialog, setEditDialog] = useState({ open: false, listType: null, id: null, name: '' })
  const [addDialog, setAddDialog] = useState({ open: false, type: null, value: '' })
  const [customFieldTypeMenuOpen, setCustomFieldTypeMenuOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, listType: null, name: '' })
  const [customFieldDialog, setCustomFieldDialog] = useState({
    open: false,
    name: '',
    type: '',
    values: '',
    mandatory: false,
    searchLists: '',
    selectedLists: [],
  })
  const customFieldTypeMenuRef = useRef(null)

  const sortedGroups = useMemo(() => {
    const list = [...groups]
    if (sortBy === 'name-az') {
      return list.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sortBy === 'name-za') {
      return list.sort((a, b) => b.name.localeCompare(a.name))
    }
    // For "Recently Created" and "Recently Modified" we just respect current order.
    return list
  }, [groups, sortBy])

  const filteredGroups = sortedGroups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const sortedCustomerGroups = useMemo(() => {
    const list = [...customerGroups]
    if (customerSortBy === 'name-az') {
      return list.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (customerSortBy === 'name-za') {
      return list.sort((a, b) => b.name.localeCompare(a.name))
    }
    return list
  }, [customerGroups, customerSortBy])

  const filteredCustomerGroups = sortedCustomerGroups.filter((g) =>
    g.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const sortedTags = useMemo(() => {
    const list = [...tags]
    if (tagSortBy === 'name-az') {
      return list.sort((a, b) => a.name.localeCompare(b.name))
    }
    if (tagSortBy === 'name-za') {
      return list.sort((a, b) => b.name.localeCompare(a.name))
    }
    return list
  }, [tags, tagSortBy])

  const filteredTags = sortedTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const tagsPageSize = 10
  const totalTagPages = Math.max(1, Math.ceil(filteredTags.length / tagsPageSize))
  const currentTagPage = Math.min(tagsPage, totalTagPages)
  const pagedTags = filteredTags.slice(
    (currentTagPage - 1) * tagsPageSize,
    currentTagPage * tagsPageSize
  )

  const fetchAllQualifiers = async () => {
    setLoading(true)
    try {
      const res = await QUALIFIERS.FETCH_ALL();
      const customFieldsRes = await SETTINGS.GET_CUSTOM_FIELDS();
      if (res?.data?.success) {
        const rows = res.data.data || [];
        setGroups(rows.filter((r) => r.type === 'product'))
        setCustomerGroups(rows.filter((r) => r.type === 'customer'))
        setTags(rows.filter((r) => r.type === 'tag'))
        setCustomFields(customFieldsRes?.data?.data || [])
      } else {
        console.error('Failed to load qualifiers', res)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllQualifiers()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customFieldTypeMenuRef.current &&
        !customFieldTypeMenuRef.current.contains(event.target)
      ) {
        setCustomFieldTypeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUpdate = async () => {
    if (!editDialog.name.trim() || !editDialog.listType) return

    try {
      const res = await QUALIFIERS.UPDATE(editDialog.id, { name: editDialog.name })
      if (res?.data?.success) {
        await fetchAllQualifiers()
        toast({ title: 'Qualifier updated', description: 'Changes were saved successfully.' })
      } else {
        toast({ title: 'Update failed', description: res?.data?.message || 'Unable to update qualifier.' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Update failed', description: err?.response?.data?.message || 'Unable to update qualifier.' })
    }

    setEditDialog({ open: false, listType: null, id: null, name: '' })
  }

  const handleDelete = async (listType, id) => {
    const findById = (arr) => arr.find((x) => x.id === id)

    let target = null
    if (listType === 'product') target = findById(groups)
    else if (listType === 'customer') target = findById(customerGroups)
    else if (listType === 'tag') target = findById(tags)

    if (target) {
      setDeleteDialog({
        open: true,
        id,
        listType,
        name: target.name,
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteDialog.id) return
    try {
      const res = await QUALIFIERS.DELETE(deleteDialog.id)
      if (res?.data?.success) {
        await fetchAllQualifiers()
        toast({ title: 'Qualifier deleted', description: 'The qualifier was removed successfully.' })
      } else {
        toast({ title: 'Delete failed', description: res?.data?.message || 'Unable to delete qualifier.' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Delete failed', description: err?.response?.data?.message || 'Unable to delete qualifier.' })
    }

    setDeleteDialog({ open: false, id: null, listType: null, name: '' })
    setMenuOpenId(null)
  }

  const handleAddFromDialog = async () => {
    const raw = addDialog.value || ''
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length === 0 || !addDialog.type) return

    try {
      for (let name of parts) {
        await QUALIFIERS.CREATE({ name, type: addDialog.type })
      }
      await fetchAllQualifiers()
      toast({ title: 'Qualifier created', description: 'The new qualifier is now available.' })
    } catch (err) {
      console.error(err)
      toast({ title: 'Add failed', description: err?.response?.data?.message || 'Unable to add qualifier.' })
    }

    setAddDialog({ open: false, type: null, value: '' })
  }

  const addDialogTitle =
    addDialog.type === 'customer'
      ? 'Add New Customer Group'
      : addDialog.type === 'tag'
        ? 'Add New Tag'
        : 'Add New Product Group'

  const filteredCustomFieldLists = listOptionsForCustomFields.filter((opt) =>
    opt.label.toLowerCase().includes(customFieldDialog.searchLists.toLowerCase())
  )

  const toggleCustomFieldList = (id) => {
    setCustomFieldDialog((prev) => {
      const already = prev.selectedLists.includes(id)
      const selected = already
        ? prev.selectedLists.filter((x) => x !== id)
        : [...prev.selectedLists, id]
      return { ...prev, selectedLists: selected }
    })
  }

  const toggleSelectAllCustomFieldLists = () => {
    setCustomFieldDialog((prev) => {
      const allIds = listOptionsForCustomFields.map((l) => l.id)
      const allSelected =
        prev.selectedLists.length === allIds.length && allIds.length > 0
      return {
        ...prev,
        selectedLists: allSelected ? [] : allIds,
      }
    })
  }

  const handleAddCustomField = async () => {
    if (!customFieldDialog.name.trim() || !customFieldDialog.type) return

    try {
      await SETTINGS.CREATE_CUSTOM_FIELD({
        name: customFieldDialog.name.trim(),
        type: customFieldDialog.type,
        values: customFieldDialog.values,
        mandatory: customFieldDialog.mandatory,
        lists: customFieldDialog.selectedLists,
      })
      await fetchAllQualifiers()
      toast({ title: 'Custom field created', description: 'Dependent forms will pick this up on next load.' })
      setCustomFieldDialog({
        open: false,
        name: '',
        type: '',
        values: '',
        mandatory: false,
        searchLists: '',
        selectedLists: [],
      })
      setCustomFieldTypeMenuOpen(false)
    } catch (error) {
      toast({ title: 'Custom field failed', description: error?.response?.data?.message || 'Unable to save the custom field.' })
    }
  }

  const handleDeleteCustomField = async (id) => {
    try {
      await SETTINGS.DELETE_CUSTOM_FIELD(id)
      await fetchAllQualifiers()
      toast({ title: 'Custom field deleted', description: 'The field was removed everywhere.' })
    } catch (error) {
      toast({ title: 'Delete failed', description: error?.response?.data?.message || 'Unable to delete the custom field.' })
    }
  }

  return (
    <div className="rounded-2xl card-surface border border-white/10 p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-[#D4AF37]">Manage Qualifiers</h2>
          <p className="text-xs md:text-sm text-white/60">
            Define product and customer qualifiers to segment your leads more effectively.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex rounded-full bg-white/5 border border-white/10 p-1 text-xs md:text-sm">
          <TabsTrigger
            value="product-groups"
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'product-groups'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Product Groups
          </TabsTrigger>
          <TabsTrigger
            value="customer-groups"
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'customer-groups'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Customer Groups
          </TabsTrigger>
          <TabsTrigger
            value="tags"
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'tags' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            Tags
          </TabsTrigger>
          <TabsTrigger
            value="custom-fields"
            className={`px-3 py-1.5 rounded-full transition-all ${
              activeTab === 'custom-fields'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Custom Fields
          </TabsTrigger>
        </TabsList>

        {/* Product Groups tab */}
        <TabsContent value="product-groups" className="space-y-4">
          {/* Search + controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Search product group"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border-white/15 text-white pl-3 pr-3 py-2 text-sm"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black/40 border border-white/15 text-xs md:text-sm text-white rounded-md px-3 py-2"
              >
                <option value="" disabled>
                  -- Sort Product Group By --
                </option>
                <option value="recent-created">Recently Created</option>
                <option value="recent-modified">Recently Modified</option>
                <option value="name-az">Name (A to Z)</option>
                <option value="name-za">Name (Z to A)</option>
              </select>
            </div>

            <div className="flex justify-end w-full md:w-auto">
              <Button
                onClick={() =>
                  setAddDialog({ open: true, type: 'product', value: '' })
                }
                className="gold-btn gold-shine whitespace-nowrap px-4 py-2 text-xs md:text-sm"
              >
                Add New
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between text-xs md:text-sm text-white/70">
              <span>
                Product Group
              </span>
              <span>Count</span>
            </div>

            <div className="divide-y divide-white/10 max-h-64 overflow-y-auto">
              {filteredGroups.map((g) => (
                <div key={g.id} className="flex items-center px-4 md:px-6 py-3 text-sm text-white/85">
                  <div className="flex-1">{g.name}</div>
                  <div className="w-24 flex justify-end">
                    <Button variant="ghost" className="text-xs" onClick={() => setEditDialog({ open: true, listType: 'product', id: g.id, name: g.name })}>Edit</Button>
                    <Button variant="ghost" className="text-xs text-red-300" onClick={() => handleDelete('product', g.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Customer Groups tab */}
        <TabsContent value="customer-groups" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Input
                  type="text"
                  placeholder="Search customer group"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-black/40 border-white/15 text-white pl-3 pr-3 py-2 text-sm"
                />
              </div>
              <select
                value={customerSortBy}
                onChange={(e) => setCustomerSortBy(e.target.value)}
                className="bg-black/40 border border-white/15 text-xs md:text-sm text-white rounded-md px-3 py-2"
              >
                <option value="recent-created">Recently Created</option>
                <option value="name-az">Name (A to Z)</option>
                <option value="name-za">Name (Z to A)</option>
              </select>
            </div>

            <div className="flex justify-end w-full md:w-auto">
              <Button onClick={() => setAddDialog({ open: true, type: 'customer', value: '' })} className="gold-btn gold-shine whitespace-nowrap px-4 py-2 text-xs md:text-sm">Add New</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="divide-y divide-white/10 max-h-64 overflow-y-auto">
              {filteredCustomerGroups.map((g) => (
                <div key={g.id} className="flex items-center px-4 md:px-6 py-3 text-sm text-white/85">
                  <div className="flex-1">{g.name}</div>
                  <div className="w-24 flex justify-end">
                    <Button variant="ghost" className="text-xs" onClick={() => setEditDialog({ open: true, listType: 'customer', id: g.id, name: g.name })}>Edit</Button>
                    <Button variant="ghost" className="text-xs text-red-300" onClick={() => handleDelete('customer', g.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tags tab */}
        <TabsContent value="tags" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Input type="text" placeholder="Search tags" value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className="w-full bg-black/40 border-white/15 text-white pl-3 pr-3 py-2 text-sm" />
              </div>
              <select value={tagSortBy} onChange={(e) => setTagSortBy(e.target.value)} className="bg-black/40 border border-white/15 text-xs md:text-sm text-white rounded-md px-3 py-2">
                <option value="recent-created">Recently Created</option>
                <option value="name-az">Name (A to Z)</option>
                <option value="name-za">Name (Z to A)</option>
              </select>
            </div>

            <div className="flex justify-end w-full md:w-auto">
              <Button onClick={() => setAddDialog({ open: true, type: 'tag', value: '' })} className="gold-btn gold-shine whitespace-nowrap px-4 py-2 text-xs md:text-sm">Add New</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="divide-y divide-white/10 max-h-80 overflow-y-auto">
              {pagedTags.map((t) => (
                <div key={t.id} className="flex items-center px-4 md:px-6 py-3 text-sm text-white/85">
                  <div className="flex-1">{t.name}</div>
                  <div className="w-24 flex justify-end">
                    <Button variant="ghost" className="text-xs" onClick={() => setEditDialog({ open: true, listType: 'tag', id: t.id, name: t.name })}>Edit</Button>
                    <Button variant="ghost" className="text-xs text-red-300" onClick={() => handleDelete('tag', t.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">Page {currentTagPage} of {totalTagPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTagsPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" onClick={() => setTagsPage((p) => Math.min(totalTagPages, p + 1))}>Next</Button>
            </div>
          </div>
        </TabsContent>

        {/* Custom fields tab */}
        <TabsContent value="custom-fields" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-white/80">Custom fields allow you to capture extra information on a lead.</div>
            <Button onClick={() => setCustomFieldDialog((d) => ({ ...d, open: true }))} className="gold-btn gold-shine px-4 py-2">Add Field</Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1.3fr)_120px_120px_minmax(0,1fr)_120px] gap-4 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/45">
              <div>Field</div>
              <div>Type</div>
              <div>Required</div>
              <div>Values</div>
              <div className="text-right">Action</div>
            </div>

            {customFields.length === 0 ? (
              <div className="px-4 py-8 text-sm text-white/55">
                No custom fields yet. Add one and it will appear in the Add Lead qualifiers form.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {customFields.map((f) => (
                  <div key={f.id} className="grid grid-cols-[minmax(0,1.3fr)_120px_120px_minmax(0,1fr)_120px] gap-4 px-4 py-4 text-sm text-white/85 items-start">
                    <div className="min-w-0">
                      <div className="font-medium text-white">{f.name}</div>
                      <div className="mt-1 text-xs text-white/45">
                        Created for dynamic lead qualifiers
                      </div>
                    </div>

                    <div>
                      <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-medium text-[#E5C766]">
                        {f.type}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          f.mandatory
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            : 'bg-white/5 text-white/60 border border-white/10'
                        }`}
                      >
                        {f.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      {f.type === 'list' && Array.isArray(f.values) && f.values.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {f.values.map((value) => (
                            <span
                              key={`${f.id}-${value}`}
                              className="inline-flex rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75"
                            >
                              {value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/45 text-xs">
                          {f.type === 'list' ? 'No values added' : 'Free input field'}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        onClick={() => handleDeleteCustomField(f.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit dialogs (simplified, reuse state) */}
      <Dialog open={addDialog.open} onOpenChange={(open) => setAddDialog((d) => ({ ...d, open }))}>
        <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-semibold text-white">{addDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Label>Name (comma separated for multiple)</Label>
            <Input className="text-black" value={addDialog.value} onChange={(e) => setAddDialog((d) => ({ ...d, value: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={() => setAddDialog({ open: false, type: null, value: '' })} variant="outline">Cancel</Button>
            <Button onClick={handleAddFromDialog} className="gold-btn gold-shine">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog((d) => ({ ...d, open }))}>
        <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-semibold text-white">Edit</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Label>Name</Label>
            <Input className="text-black" value={editDialog.name} onChange={(e) => setEditDialog((d) => ({ ...d, name: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={() => setEditDialog({ open: false, listType: null, id: null, name: '' })} variant="outline">Cancel</Button>
            <Button onClick={handleUpdate} className="gold-btn gold-shine">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customFieldDialog.open} onOpenChange={(open) => setCustomFieldDialog((d) => ({ ...d, open }))}>
        <DialogContent className="bg-[#060606] border border-white/10 text-white rounded-3xl max-w-2xl w-full p-0 overflow-hidden shadow-2xl">
          <DialogHeader>
            <div className="border-b border-white/10 px-6 py-5 bg-[linear-gradient(135deg,rgba(212,175,55,0.10),rgba(212,175,55,0.02)_35%,transparent_100%)]">
              <DialogTitle className="text-xl md:text-2xl font-semibold text-white">Add Custom Field</DialogTitle>
              <p className="mt-1 text-sm text-white/60">
                Create dynamic qualifier fields that will appear automatically inside the Add Lead form.
              </p>
            </div>
          </DialogHeader>
          <div className="px-6 py-6 space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="space-y-2">
                <Label className="text-white/85">Field Name</Label>
                <Input
                  className="h-12 bg-black/40 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-1 focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37]"
                  placeholder="e.g. Project Group, Budget Range"
                  value={customFieldDialog.name}
                  onChange={(e) => setCustomFieldDialog((d) => ({ ...d, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/85">Type</Label>
                <div className="relative" ref={customFieldTypeMenuRef}>
                  <button
                    type="button"
                    onClick={() => setCustomFieldTypeMenuOpen((open) => !open)}
                    className="h-12 w-full bg-black/40 border border-white/15 text-white text-sm rounded-xl px-4 py-2 flex items-center justify-between focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  >
                    <span className={customFieldDialog.type ? 'text-white' : 'text-white/50'}>
                      {customFieldDialog.type
                        ? customFieldDialog.type.charAt(0).toUpperCase() + customFieldDialog.type.slice(1)
                        : 'Select type'}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 text-white/70 transition-transform ${customFieldTypeMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {customFieldTypeMenuOpen && (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl">
                      {[
                        { value: 'text', label: 'Text' },
                        { value: 'number', label: 'Number' },
                        { value: 'list', label: 'List' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setCustomFieldDialog((d) => ({ ...d, type: option.value, values: option.value === 'list' ? d.values : '' }))
                            setCustomFieldTypeMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                            customFieldDialog.type === option.value
                              ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                              : 'text-white/85 hover:bg-white/5'
                          }`}
                        >
                          <span>{option.label}</span>
                          {customFieldDialog.type === option.value ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M5 10.5 8.5 14 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {customFieldDialog.type === 'list' && (
              <div className="space-y-2">
                <Label className="text-white/85">List Values</Label>
                <p className="text-xs text-white/50">
                  Add one value per line. These will appear in the dropdown inside Add Leads.
                </p>
                <textarea
                  value={customFieldDialog.values}
                  onChange={(e) => setCustomFieldDialog((d) => ({ ...d, values: e.target.value }))}
                  placeholder={`Example:\nPremium\nStandard\nEnterprise`}
                  className="min-h-32 w-full resize-y rounded-2xl bg-black/40 border border-white/15 text-white placeholder:text-white/35 p-3 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customFieldDialog.mandatory}
                  onChange={() => setCustomFieldDialog((d) => ({ ...d, mandatory: !d.mandatory }))}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <div>
                  <div className="text-sm font-medium text-white/90">Mandatory field</div>
                  <div className="text-xs text-white/55">
                    Leads cannot be saved until this field is filled in.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="border-t border-white/10 px-6 py-4 flex-row items-center justify-end gap-3">
            <Button
              onClick={() => {
                setCustomFieldDialog({ open: false, name: '', type: '', values: '', mandatory: false, searchLists: '', selectedLists: [] })
                setCustomFieldTypeMenuOpen(false)
              }}
              variant="outline"
              className="border-white/15 bg-transparent text-white/80 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleAddCustomField} className="gold-btn gold-shine min-w-28">
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({
            ...prev,
            open,
            id: open ? prev.id : null,
            listType: open ? prev.listType : null,
            name: open ? prev.name : '',
          }))
        }
        title="Delete Qualifier?"
        description="This action cannot be undone. Are you sure you want to delete this qualifier?"
        details={
          deleteDialog.name ? (
            <div className="space-y-1">
              <div className="font-medium text-white">{deleteDialog.name}</div>
              <div className="text-white/60">{deleteDialog.listType || 'Qualifier'}</div>
            </div>
          ) : null
        }
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  )
}

export default ManageQualifiers
