import React, { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog'
import { MoreVertical } from 'lucide-react'
import { Label } from '../../../../components/ui/label'

function LeadStageCustomization() {
  const initialStages = [
    { id: 'open', name: 'Open', state: 'New', locked: true },
    { id: 'inactive', name: 'Inactive', state: '', locked: false },
    { id: 'contacted', name: 'Contacted', state: '', locked: false },
    { id: 'contacted-fu', name: 'Contacted - Follow Up', state: '', locked: false },
    { id: 'qualified', name: 'Qualified', state: '', locked: false },
    { id: 'qualified-fu', name: 'Qualified - Follow Up', state: '', locked: false },
    { id: 'sv-await', name: 'SV - Awaiting', state: '', locked: false },
    { id: 'sv-done-fu', name: 'SV - Done - Follow Up', state: '', locked: false },
    { id: 'requirement', name: 'Requirement', state: '', locked: false },
    { id: 'requirement-sent', name: 'Requirement - SENT', state: '', locked: false },
    { id: 'deal-lost', name: 'Deal Lost', state: 'Lost', locked: true },
    { id: 'deal-done', name: 'Deal Done', state: 'Won', locked: true },
  ]

  const [stages, setStages] = useState(initialStages)
  const [menuOpenId, setMenuOpenId] = useState(null)

  const [addStageDialog, setAddStageDialog] = useState({
    open: false,
    name: '',
    state: '',
  })

  const [editStageDialog, setEditStageDialog] = useState({
    open: false,
    id: null,
    name: '',
    state: '',
  })

  const [renameDialog, setRenameDialog] = useState({
    open: false,
    items: [],
  })

  const totalStages = stages.length

  const openEdit = (stage) => {
    setEditStageDialog({
      open: true,
      id: stage.id,
      name: stage.name,
      state: stage.state || '',
    })
    setMenuOpenId(null)
  }

  const handleEditSave = () => {
    if (!editStageDialog.name.trim() || !editStageDialog.id) return
    setStages((prev) =>
      prev.map((s) =>
        s.id === editStageDialog.id
          ? { ...s, name: editStageDialog.name.trim(), state: editStageDialog.state }
          : s
      )
    )
    setEditStageDialog({ open: false, id: null, name: '', state: '' })
  }

  const handleDeleteStage = (stage) => {
    if (stage.state === 'New' || stage.state === 'Won' || stage.state === 'Lost') {
      window.alert('Stages with states New, Won or Lost cannot be deleted.')
      return
    }
    if (!window.confirm(`Delete stage "${stage.name}"?`)) return
    setStages((prev) => prev.filter((s) => s.id !== stage.id))
    setMenuOpenId(null)
  }

  const handleAddStage = () => {
    if (!addStageDialog.name.trim()) return
    const id = `custom-${Date.now()}`
    setStages((prev) => [
      ...prev,
      {
        id,
        name: addStageDialog.name.trim(),
        state: addStageDialog.state,
        locked: false,
      },
    ])
    setAddStageDialog({ open: false, name: '', state: '' })
  }

  const stateBadgeClass = (state) => {
    if (state === 'New') return 'bg-sky-500/15 text-sky-300 border-sky-500/40'
    if (state === 'Won') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
    if (state === 'Lost') return 'bg-red-500/15 text-red-300 border-red-500/40'
    return 'bg-white/5 text-white/60 border-white/20'
  }

  return (
    <div className="grid lg:grid-cols-[2.5fr,1.2fr] gap-6">
      {/* Main table */}
      <div className="rounded-2xl card-surface border border-white/10 p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl font-semibold text-[#D4AF37]">
              Lead Stage Customization
            </h2>
            <div className="text-xs md:text-sm text-white/70">
              Total Lead Stages :{' '}
              <span className="font-semibold text-white">{totalStages}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                setAddStageDialog({ open: true, name: '', state: '' })
              }
              className="gold-btn gold-shine px-4 py-2 text-xs md:text-sm"
            >
              + Add New Stage
            </Button>
            <Button
              variant="outline"
              className={`border border-white/25 bg-black/40 text-xs md:text-sm px-4 py-2 ${
                renameDialog.open ? 'text-[#D4AF37] border-[#D4AF37]/70' : 'text-white/80'
              }`}
              onClick={() =>
                setRenameDialog({ open: true, items: stages.map((s) => ({ ...s })) })
              }
            >
              Rename and Reorder
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          <div className="px-4 md:px-6 py-3 border-b border-white/10 text-xs md:text-sm text-white/70 flex items-center">
            <div className="flex-1">Stage</div>
            <div className="w-28 md:w-32">State</div>
            <div className="w-16 text-right">Action</div>
          </div>

          <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-center px-4 md:px-6 py-3 text-sm text-white/85 bg-gradient-to-r from-white/[0.01] to-transparent hover:from-[#D4AF37]/5 transition-all duration-200 ease-out"
              >
                {/* Stage name */}
                <div className="flex-1 flex items-center gap-3">
                  <span className="w-6 text-xs text-white/50">{index + 1}.</span>
                  <span className="font-medium tracking-wide">{stage.name}</span>
                </div>

                {/* State */}
                <div className="w-28 md:w-32 flex items-center">
                  {stage.state ? (
                    <span
                      className={`inline-flex items-center justify-center rounded-full border px-3 py-0.5 text-[11px] ${stateBadgeClass(
                        stage.state
                      )}`}
                    >
                      {stage.state}
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/40">—</span>
                  )}
                </div>

                {/* Action */}
                <div className="w-16 flex justify-end relative">
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpenId((prev) =>
                        prev === stage.id ? null : stage.id
                      )
                    }
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {menuOpenId === stage.id && (
                    <div className="absolute right-0 top-9 w-40 rounded-lg border border-white/10 bg-black/95 shadow-xl z-20 text-xs">
                      <button
                        type="button"
                        onClick={() => openEdit(stage)}
                        className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10"
                      >
                        Edit stage
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStage(stage)}
                        className={`w-full text-left px-3 py-2 hover:bg-red-500/10 ${
                          stage.state === 'New' ||
                          stage.state === 'Won' ||
                          stage.state === 'Lost'
                            ? 'text-white/35 cursor-not-allowed'
                            : 'text-red-300'
                        }`}
                        disabled={
                          stage.state === 'New' ||
                          stage.state === 'Won' ||
                          stage.state === 'Lost'
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side info panel */}
      <aside className="rounded-2xl card-surface border border-white/10 p-4 md:p-5 text-xs md:text-sm text-white/80 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm md:text-base font-semibold text-white">
            Lead Stage Customization
          </h3>
          <span className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center text-[11px] text-white/60">
            ?
          </span>
        </div>

        <p>
          You can customize lead stages to meet your specific business needs. Changes here are at account
          level and will be reflected for all lists and users, including existing leads, filters, charts and
          reports.
        </p>

        <div className="space-y-1">
          <div className="font-semibold text-white">Customization options:</div>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Add new stages</li>
            <li>Edit stage labels / terms</li>
            <li>Reorder the lead stage sequence</li>
            <li>Delete non-essential stages</li>
          </ol>
        </div>

        <div className="space-y-1">
          <div className="font-semibold text-white">Important:</div>
          <p>
            Stages with states <span className="font-semibold">New</span>,{' '}
            <span className="font-semibold">Won</span> and{' '}
            <span className="font-semibold">Lost</span> cannot be deleted.
          </p>
        </div>

        <div className="border-t border-white/15 pt-3 text-[11px] text-white/60">
          The predefined stages are <span className="text-white/80">Open, Contacted, Qualified, Customer, Inactive
          Customer, Deal Lost</span>. You can add more stages that match your funnel.
        </div>
      </aside>

      {/* Add stage dialog */}
      <Dialog
        open={addStageDialog.open}
        onOpenChange={(open) =>
          setAddStageDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-semibold text-white">
              Add New Stage
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-xs md:text-sm">
            <div className="space-y-1">
              <Label className="text-[11px] md:text-xs text-white/70">
                Stage Name <span className="text-red-400">*</span>
              </Label>
              <input value={addStageDialog.name} onChange={(e) => setAddStageDialog((p) => ({ ...p, name: e.target.value }))} className="w-full bg-black/40 border border-white/15 text-white p-2 rounded-md" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStageDialog({ open: false, name: '', state: '' })}>Cancel</Button>
            <Button onClick={handleAddStage} className="gold-btn gold-shine">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editStageDialog.open} onOpenChange={(open) => setEditStageDialog((p) => ({ ...p, open }))}>
        <DialogContent className="bg-black/90 border border-white/10 text-white rounded-2xl max-w-lg w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg font-semibold text-white">Edit Stage</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Label>Name</Label>
            <input value={editStageDialog.name} onChange={(e) => setEditStageDialog((p) => ({ ...p, name: e.target.value }))} className="w-full bg-black/40 border border-white/15 text-white p-2 rounded-md" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStageDialog({ open: false, id: null, name: '', state: '' })}>Cancel</Button>
            <Button onClick={handleEditSave} className="gold-btn gold-shine">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeadStageCustomization
