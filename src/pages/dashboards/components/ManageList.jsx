import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog'
import { Users } from 'lucide-react'
import LISTS from '../../../services/listService'
import ADMIN from '../../../services/adminService'

function ManageList({
  lists: initialLists = [],
  onCreate,
  onDelete,
  onUpdate,
  onAddLeadClick
}) {
  const [lists, setLists] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [listOwner, setListOwner] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent-created')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [editDialog, setEditDialog] = useState({
    open: false,
    listId: null,
    listName: '',
    listOwner: '',
    autoWhatsapp: false,
    sendGreetingEmail: false,
    shareBusinessCard: false,
    emailTemplate: '',
    subject: 'Thank you for your interest in Vespera Estates Pvt Ltd',
    emailContent:
      'Dear #VisitorName#,\n\nThank you for your interest in Vespera Estates Pvt Ltd. We are glad to support #VisitorCompanyName# with our products and services.\n\nWe will be glad to stay in touch and we look forward to understanding your business needs.\n\nBest Regards,\n#firstname# #lastname#\n#designation#\nVespera Estates Pvt Ltd\nE: #email#\nM: #mobile#',
    sendGreetingSms: false,
    smsTemplate: '',
    smsContent:
      'Thank you for your interest in Vespera Estates Pvt Ltd. - Vespera Estates Pvt Ltd',
  })

  // Fetch lists from API on component mount
  useEffect(() => {
    const fetchLists = async () => {
      const response = await LISTS.FETCH_WITH_COUNTS();
      if (response && response.status === 200) {
        setLists(response.data.data);
      }
    }
    fetchLists()
  }, [])

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        const response = await ADMIN.FETCH_USERS()
        if (response && response.status === 200) {
          // Filter users with roles: manager, l1, l2
          const filteredUsers = response.data.data.filter(u =>
            ['manager', 'l1', 'l2'].includes(u.role)
          )
          setUsers(filteredUsers)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (initialLists && initialLists.length) {
      setLists(initialLists)
    }
  }, [initialLists])

  const MAX_LISTS = 10
  const MAX_LEADS = 250

  const totalLists = lists.length
  const totalLeads = useMemo(
    () => lists.reduce((sum, l) => sum + (Number(l.total_leads) || 0), 0),
    [lists]
  )

  const sortedLists = useMemo(() => {
    const copy = [...lists]
    if (sortBy === 'name-az') {
      return copy.sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''))
      )
    }
    if (sortBy === 'name-za') {
      return copy.sort((a, b) =>
        String(b.name || '').localeCompare(String(a.name || ''))
      )
    }
    // Recently created (fallback to current order if timestamps missing)
    return copy.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
  }, [lists, sortBy])

  const filteredLists = sortedLists.filter((l) =>
    String(l.name || '').toLowerCase().includes(search.toLowerCase())
  )

  // Create List: delegate to parent via onCreate when provided, otherwise use local static data.
  const onAdd = async () => {
    setLoading(true)
    setError('')
    try {
      if (!name) throw new Error('List name is required')
      if (!listOwner) throw new Error('List owner is required')

      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        list_owner: listOwner
      }

      if (onCreate) {
        await onCreate(name, description)
      } else {
        const response = await LISTS.CREATE(payload)
        if (response && response.status === 201 && response.data?.data) {
          const newList = response.data.data
          setLists((prev) => [newList, ...prev])
        } else {
          throw new Error(response?.data?.message || 'Failed to create list')
        }
      }

      setName('')
      setDescription('')
      setListOwner('')
      setShowCreate(false)
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  // Delete List: delegate to parent via onDelete when provided, otherwise update local state.
  const handleDelete = async (id) => {
    setError('')
    try {
      if (onDelete) {
        await onDelete(id)
      } else {
        setLists((prev) => prev.filter((l) => String(l.id) !== String(id)))
      }
    } catch (e) {
      setError(String(e?.message || e))
    }
  }

  const openEdit = (list) => {
    setEditDialog((prev) => ({
      ...prev,
      open: true,
      listId: list.id,
      listName: list.name || '',
      listOwner: list.owner || '',
    }))
  }

  const handleUpdateList = async () => {
    if (!editDialog.listName.trim() || !editDialog.listId) {
      setError('List name is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (onUpdate) {
        await onUpdate(editDialog.listId, {
          name: editDialog.listName.trim(),
        })
      } else {
        setLists((prev) =>
          prev.map((l) =>
            String(l.id) === String(editDialog.listId)
              ? {
                ...l,
                name: editDialog.listName.trim(),
                owner: editDialog.listOwner || l.owner,
              }
              : l
          )
        )
      }
      setEditDialog((prev) => ({ ...prev, open: false }))
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#D4AF37]">Manage Lists</h1>
          <Button
            onClick={() => setShowCreate(true)}
            className="gold-btn gold-shine flex items-center gap-2 px-4 py-2 text-sm"
          >
            + Create List
          </Button>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={onAddLeadClick}
          className="gold-btn gold-shine absolute right-0 top-[-70px] flex items-center gap-2 px-4 py-2 text-sm"
        >
          + Add Lead
        </button>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 max-w-xl">
          <Input
            placeholder="Search list name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/40 border-white/15 text-white"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-black/40 border border-white/15 text-xs md:text-sm text-white rounded-md px-3 py-2 w-full md:w-56"
        >
          <option value="recent-created">Recently Created</option>
          <option value="name-az">Name (A to Z)</option>
          <option value="name-za">Name (Z to A)</option>
        </select>
      </div>

      {/* Metrics row */}
      <div className="flex flex-wrap gap-4 text-xs md:text-sm text-white/70">
        <span>
          Total Lists :{' '}
          <span className="font-semibold text-[#D4AF37]">{totalLists}</span>
          <span className="text-white/40"> / {MAX_LISTS}</span>
        </span>
        <span>
          Total Leads / Customers :{' '}
          <span className="font-semibold text-[#D4AF37]">{totalLeads}</span>
          <span className="text-white/40"> / {MAX_LEADS}</span>
        </span>
      </div>

      {/* Lists Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLists.length > 0 ? (
          filteredLists.map((l, index) => (
            <div
              key={l.id || index}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-md hover:shadow-2xl hover:border-[#D4AF37]/40 transition-all duration-300 ease-out transform hover:-translate-y-2 flex flex-col items-center text-center"
            >
              {/* Edit Button */}
              <div className="self-end mb-1">
                <button
                  type="button"
                  onClick={() => openEdit(l)}
                  className="text-[#D4AF37]/90 hover:text-[#D4AF37] text-sm flex items-center gap-1"
                >
                  <span className="underline">Edit</span>
                </button>
              </div>

              {/* Title */}
              <h2 className="text-lg font-bold text-white tracking-wide mb-3 uppercase">
                {l.name || 'Untitled'}
              </h2>

              {/* Owner Info */}
              <p className="text-white/80 text-sm">
                List owner <span className="font-semibold text-white">{l.list_owner || '—'}</span>
              </p>
              <p className="text-white/50 text-xs mb-5">
                List created on{' '}
                {l.created_at
                  ? new Date(l.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  : '—'}
              </p>

              {/* View Leads Button */}
              <Button className="bg-[#007BFF] hover:bg-[#0066CC] text-white w-48 font-medium py-2 rounded-lg flex items-center justify-center gap-2 mb-5">
                <Users className="w-4 h-4" />
                View Leads ({l.total_leads || 0})
              </Button>

              {/* Stats Row */}
              <div className="flex justify-center items-center gap-4 mt-auto">
                <div className="flex items-center gap-1">
                  <span className="text-white/80 text-sm">Follow-Up</span>
                  <span className="bg-orange-500 text-black font-semibold text-xs px-2 py-0.5 rounded-md">
                    {l.follow_up || 0}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white/80 text-sm">Deal Done</span>
                  <span className="bg-red-500 text-white font-semibold text-xs px-2 py-0.5 rounded-md">
                    {l.deal_done || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-white/50 py-10">
            No lists found.
          </div>
        )}
      </div>

      {/* Create List Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (open) setShowCreate(true)
        }}
      >
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="bg-black/80 border border-white/10 text-white rounded-2xl max-w-2xl w-full p-8 fade-in"
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[#D4AF37] text-xl font-semibold">
              List Details
            </DialogTitle>
          </DialogHeader>

          {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

          {/* Form */}
          <div className="grid sm:grid-cols-2 gap-6 mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/80 font-medium">List Name *</label>
              <Input
                placeholder="List name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/40 border-white/15 text-white p-3 rounded-md"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-white/80 font-medium">List Owner *</label>
              <select
                value={listOwner}
                onChange={(e) => setListOwner(e.target.value)}
                className="bg-black/40 border border-white/15 text-white rounded-md p-3 focus:outline-none w-full"
                disabled={usersLoading}
              >
                <option value="">-- Select List Owner --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.username} ({u.email}) ({u.role})
                  </option>
                ))}
              </select>
              {usersLoading && <p className="text-xs text-white/50">Loading users...</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/40 border-white/15 text-white p-3 rounded-md"
            />
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <label className="text-sm text-white/80 font-medium">Subject Name *</label>
            <Input
              value="Thank you for your interest in Vespera Estates Pvt Ltd"
              readOnly
              className="bg-gray-400 text-black p-3 rounded-md border border-white/10 opacity-90 cursor-not-allowed"
            />
          </div>

          <DialogFooter className="flex justify-end gap-3 mt-8">
            <Button
              onClick={() => {
                setShowCreate(false)
                setName('')
                setDescription('')
                setListOwner('')
                setError('')
              }}
              className="border border-white/20 text-white hover:bg-white/10 px-5 py-2"
            >
              Cancel
            </Button>
            <Button
              disabled={!name || !listOwner || loading}
              onClick={onAdd}
              className="bg-[#D4AF37] hover:bg-[#c29e32] text-black font-semibold px-5 py-2"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-4xl w-full p-6 md:p-8 fade-in">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-semibold text-white flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
              <span>Update List - {editDialog.listName || 'List'}</span>
              <span className="text-[11px] text-red-400 font-normal">(*) Required fields</span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1 text-xs md:text-sm">
            {/* List Detail */}
            <section className="rounded-2xl border border-white/15 bg-black/70 p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white text-sm md:text-base">List Detail</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs text-white/70">
                    List Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={editDialog.listName}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        listName: e.target.value,
                      }))
                    }
                    className="bg-black/40 border-white/20 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs text-white/70">
                    List Owner <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={editDialog.listOwner}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        listOwner: e.target.value,
                      }))
                    }
                    placeholder="Owner name / email"
                    className="bg-black/40 border-white/20 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-[11px] md:text-xs text-white/80">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDialog.autoWhatsapp}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        autoWhatsapp: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/40 bg-black/60"
                  />
                  <span>Auto WhatsApp greeting message</span>
                </label>
              </div>
            </section>

            {/* Email message content */}
            <section className="rounded-2xl border border-white/15 bg-black/70 p-4 md:p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm md:text-base">Email message content</h3>
                <p className="text-[11px] md:text-xs text-white/60">
                  Send automatic emails to leads / customers instantly.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-[11px] md:text-xs text-white/80">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDialog.sendGreetingEmail}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        sendGreetingEmail: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/40 bg-black/60"
                  />
                  <span>Send Greeting email</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDialog.shareBusinessCard}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        shareBusinessCard: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/40 bg-black/60"
                  />
                  <span>Share Business Card</span>
                </label>
              </div>

              <div className="grid md:grid-cols-[2fr,1fr] gap-4 items-end">
                <div className="space-y-1">
                  <Label className="text-[11px] md:text-xs text-white/70">Select template</Label>
                  <select
                    value={editDialog.emailTemplate}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        emailTemplate: e.target.value,
                      }))
                    }
                    className="w-full bg-black/40 border border-white/20 text-white text-xs md:text-sm rounded-md px-3 py-2 focus:outline-none"
                  >
                    <option value="">-- Select a Template --</option>
                    <option value="default">Vespera - Default</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button className="border border-white/25 bg-black/40 text-white/80 text-[11px] md:text-xs px-3 py-2">
                    Manage Email templates
                  </Button>
                </div>
              </div>

              {/* File attachment (visual only, hook into backend later) */}
              <div className="space-y-2">
                <Label className="text-[11px] md:text-xs text-white/70">
                  File attachment
                  <span className="text-white/50"> (One file with maximum size of 5 MB)</span>
                </Label>
                <div className="mt-1 rounded-md border border-dashed border-white/25 bg-black/40 px-4 py-6 text-center text-[11px] md:text-xs text-white/60 hover:border-[#D4AF37]/60 hover:bg-black/60 transition-colors">
                  <div className="font-medium text-white/80 mb-1">Choose or drop a file here</div>
                  <div className="text-white/40">No file selected</div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] md:text-xs text-white/70">Subject *</Label>
                <Input
                  value={editDialog.subject}
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="bg-black/40 border-white/20 text-white text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] md:text-xs text-white/70">Content</Label>
                <div className="rounded-lg border border-white/20 bg-black/40 overflow-hidden">
                  {/* Editor top menu (visual only) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-[10px] md:text-[11px] text-white/70 bg-black/60">
                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="hover:text-white">File</button>
                      <button type="button" className="hover:text-white">Edit</button>
                      <button type="button" className="hover:text-white">Insert</button>
                      <button type="button" className="hover:text-white">View</button>
                      <button type="button" className="hover:text-white">Format</button>
                      <button type="button" className="hover:text-white">Table</button>
                      <button type="button" className="hover:text-white">Tools</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] md:text-[11px] text-white/80 hover:border-[#D4AF37]/70 hover:text-white"
                      >
                        Placeholders for Lead
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/25 bg-black/40 px-2.5 py-1 text-[10px] md:text-[11px] text-white/80 hover:border-[#D4AF37]/70 hover:text-white"
                      >
                        Placeholders for User
                      </button>
                    </div>
                  </div>

                  {/* Editor toolbar row (simplified) */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-[10px] md:text-[11px] text-white/70 bg-black/40">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded border border-white/25 bg-black/60 font-semibold text-[10px]">
                        B
                      </span>
                      <span className="px-1.5 py-0.5 rounded border border-white/25 bg-black/60 italic text-[10px]">
                        I
                      </span>
                      <span className="px-1.5 py-0.5 rounded border border-white/25 bg-black/60 underline text-[10px]">
                        U
                      </span>
                    </div>
                    <div className="h-4 w-px bg-white/20" />
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded border border-white/25 bg-black/60 text-[10px]">
                        •
                      </span>
                      <span className="px-1.5 py-0.5 rounded border border-white/25 bg-black/60 text-[10px]">
                        1.
                      </span>
                    </div>
                  </div>

                  {/* Editor textarea */}
                  <textarea
                    value={editDialog.emailContent}
                    onChange={(e) =>
                      setEditDialog((prev) => ({
                        ...prev,
                        emailContent: e.target.value,
                      }))
                    }
                    rows={8}
                    className="w-full bg-transparent border-0 text-xs md:text-sm text-white px-3 py-2 focus:outline-none focus:ring-0 resize-vertical"
                  />
                </div>

                <p className="text-[10px] md:text-[11px] text-white/50">
                  Personalize your email by using placeholders like{' '}
                  <span className="text-white">#VisitorName#</span>,{' '}
                  <span className="text-white">#VisitorCompanyName#</span>,{' '}
                  <span className="text-white">#firstname#</span>,{' '}
                  <span className="text-white">#lastname#</span>,{' '}
                  <span className="text-white">#designation#</span>,{' '}
                  <span className="text-white">#email#</span> and{' '}
                  <span className="text-white">#mobile#</span>.
                </p>
                <p className="text-[10px] md:text-[11px] text-white/40">
                  Tip: Press <span className="font-semibold">Shift + Enter</span> for a single line break.
                </p>
              </div>
            </section>

            {/* SMS / Text message content */}
            <section className="rounded-2xl border border-white/15 bg-black/70 p-4 md:p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-white text-sm md:text-base">Text / SMS message content</h3>
                <p className="text-[11px] md:text-xs text-white/60">
                  Send automatic greeting SMS to every lead you add.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-[11px] md:text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editDialog.sendGreetingSms}
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      sendGreetingSms: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-white/40 bg-black/60"
                />
                <span>Send Greeting Text / SMS</span>
              </label>

              <div className="space-y-1">
                <Label className="text-[11px] md:text-xs text-white/70">Select texting / SMS template</Label>
                <select
                  value={editDialog.smsTemplate}
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      smsTemplate: e.target.value,
                    }))
                  }
                  className="w-full bg-black/40 border border-white/20 text-white text-xs md:text-sm rounded-md px-3 py-2 focus:outline-none"
                >
                  <option value="">-- Select template --</option>
                  <option value="default">Vespera - Default</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] md:text-xs text-white/70">SMS / Text content</Label>
                  <span className="text-[10px] md:text-[11px] text-white/50">
                    {Math.max(
                      0,
                      700 - (editDialog.smsContent ? editDialog.smsContent.length : 0)
                    )}{' '}
                    / 700 left
                  </span>
                </div>
                <textarea
                  value={editDialog.smsContent}
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      smsContent: e.target.value,
                    }))
                  }
                  rows={4}
                  maxLength={700}
                  className="w-full rounded-md bg-black/40 border border-white/20 text-white text-xs md:text-sm px-3 py-2 focus:outline-none resize-vertical"
                />
                <p className="text-[10px] md:text-[11px] text-white/50">
                  Note: You may use <span className="text-white">#LeadName#</span> (Lead / Customer name) and{' '}
                  <span className="text-white">#LeadOrganizationName#</span> (Organization name) in your SMS text.
                </p>
              </div>
            </section>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-3">
            <Button
              onClick={() =>
                setEditDialog((prev) => ({
                  ...prev,
                  open: false,
                }))
              }
              className="border border-white/25 text-white bg-transparent hover:bg-white/10 px-5 py-2 text-xs md:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateList}
              disabled={!editDialog.listName.trim() || loading}
              className="gold-btn gold-shine px-6 py-2 text-xs md:text-sm font-semibold"
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManageList
