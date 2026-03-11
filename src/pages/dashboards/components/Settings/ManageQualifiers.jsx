import React, { useState, useMemo, useEffect } from 'react'
import QUALIFIERS from '../../../../services/qualifierService'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs'

function ManageQualifiers() {
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
  const [customFieldDialog, setCustomFieldDialog] = useState({
    open: false,
    name: '',
    type: '',
    values: '',
    mandatory: false,
    searchLists: '',
    selectedLists: [],
  })

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
      if (res?.data?.success) {
        const rows = res.data.data || [];
        setGroups(rows.filter((r) => r.type === 'product'))
        setCustomerGroups(rows.filter((r) => r.type === 'customer'))
        setTags(rows.filter((r) => r.type === 'tag'))
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

  const handleUpdate = async () => {
    if (!editDialog.name.trim() || !editDialog.listType) return

    try {
      const res = await QUALIFIERS.UPDATE(editDialog.id, { name: editDialog.name })
      if (res?.data?.success) {
        await fetchAllQualifiers()
      } else {
        window.alert('Update failed')
      }
    } catch (err) {
      console.error(err)
      window.alert('Update failed')
    }

    setEditDialog({ open: false, listType: null, id: null, name: '' })
  }

  const handleDelete = async (listType, id) => {
    const findById = (arr) => arr.find((x) => x.id === id)

    let target = null
    if (listType === 'product') target = findById(groups)
    else if (listType === 'customer') target = findById(customerGroups)
    else if (listType === 'tag') target = findById(tags)

    if (target && !window.confirm(`Delete qualifier "${target.name}"?`)) return

    try {
      const res = await QUALIFIERS.DELETE(id)
      if (res?.data?.success) {
        await fetchAllQualifiers()
      } else {
        window.alert('Delete failed')
      }
    } catch (err) {
      console.error(err)
      window.alert('Delete failed')
    }

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
    } catch (err) {
      console.error(err)
      window.alert('Add failed')
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

  const handleAddCustomField = () => {
    if (!customFieldDialog.name.trim() || !customFieldDialog.type) return

    const field = {
      id: `field-${Date.now()}`,
      name: customFieldDialog.name.trim(),
      type: customFieldDialog.type,
      values: customFieldDialog.values,
      mandatory: customFieldDialog.mandatory,
      lists: customFieldDialog.selectedLists,
    }

    setCustomFields((prev) => [...prev, field])

    setCustomFieldDialog({
      open: false,
      name: '',
      type: '',
      values: '',
      mandatory: false,
      searchLists: '',
      selectedLists: [],
    })
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

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
            {customFields.length === 0 ? (
              <div>No custom fields yet.</div>
            ) : (
              <div className="space-y-2">
                {customFields.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div>{f.name} ({f.type})</div>
                    <div className="flex gap-2">
                      <Button variant="ghost">Edit</Button>
                      <Button variant="ghost" className="text-red-300">Delete</Button>
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
        <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-semibold text-white">Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4 text-xs md:text-sm">
            <Label>Field Name</Label>
            <Input className="text-black" value={customFieldDialog.name} onChange={(e) => setCustomFieldDialog((d) => ({ ...d, name: e.target.value }))} />

            <Label>Type</Label>
            <select value={customFieldDialog.type} onChange={(e) => setCustomFieldDialog((d) => ({ ...d, type: e.target.value }))} className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-3 py-2 w-full">
              <option value="">Select type</option>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="list">List</option>
            </select>

            {customFieldDialog.type === 'list' && (
              <div>
                <Label>List values (one per line)</Label>
                <textarea value={customFieldDialog.values} onChange={(e) => setCustomFieldDialog((d) => ({ ...d, values: e.target.value }))} className="w-full bg-black/40 border border-white/15 text-white p-2 rounded-md" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <input type="checkbox" checked={customFieldDialog.mandatory} onChange={() => setCustomFieldDialog((d) => ({ ...d, mandatory: !d.mandatory }))} />
              <div className="text-white/80">Mandatory</div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCustomFieldDialog({ open: false, name: '', type: '', values: '', mandatory: false, searchLists: '', selectedLists: [] })} variant="outline">Cancel</Button>
            <Button onClick={handleAddCustomField} className="gold-btn gold-shine">Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageQualifiers
