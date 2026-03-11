import React, { useMemo, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useToast } from '../hooks/use-toast.js'
// import { useAuth } from '../context/AuthProvider'

export default function UserManager() {
  const { addUser, removeUser, listUsers, user } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ id: '', email: '', password: '', role: 'sales', name: '' })
  const users = useMemo(() => listUsers(), [listUsers, user])

  const onAdd = (e) => {
    e.preventDefault()
    try {
      addUser(form)
      toast({ title: 'User added', description: `${form.id || form.email} (${form.role})` })
      setForm({ id: '', email: '', password: '', role: 'sales', name: '' })
    } catch (err) {
      toast({ title: 'Failed to add user', description: err?.message || 'Unknown error' })
    }
  }

  const onRemove = (identifier) => {
    if (!identifier) return
    if (!window.confirm(`Remove user ${identifier}?`)) return
    try {
      const removed = removeUser(identifier)
      toast({ title: 'User removed', description: `${removed?.id || removed?.email}` })
    } catch (err) {
      toast({ title: 'Failed to remove', description: err?.message || 'Unknown error' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-6">
        <h3 className="h3-section text-white">Add Team User</h3>
        <form onSubmit={onAdd} className="mt-4 grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="uid">Team ID</Label>
              <Input id="uid" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="e.g. john_doe" className="bg-black/40 border-white/15 text-white" />
              <div className="text-xs text-white/50">Alternatively, provide an email.</div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@company.com" className="bg-black/40 border-white/15 text-white" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name (optional)</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="bg-black/40 border-white/15 text-white" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role">Role</Label>
              <select id="role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="bg-black/40 border border-white/15 text-white rounded-md h-10 px-3">
                <option value="sales">Sales Team</option>
                <option value="marketing">Marketing Team</option>
                <option value="customer">Customer Handling Team</option>
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pwd">Password</Label>
            <Input id="pwd" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Minimum 4 characters" className="bg-black/40 border-white/15 text-white" />
          </div>
          <div>
            <Button type="submit" className="gold-btn gold-shine">Add User</Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-6">
        <h3 className="h3-section text-white">Existing Users</h3>
        <div className="mt-4 grid gap-3">
          {users.length === 0 && <div className="text-white/60">No users found.</div>}
          {users.map((u, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85">
              <div className="flex items-center gap-3">
                <span className="text-white">{u.name || u.id || u.email}</span>
                <span className="text-white/60">({u.role})</span>
                <span className="text-white/50">{u.email || u.id}</span>
              </div>
              <div>
                {(u.role === 'superadmin') ? (
                  <span className="text-white/40 text-xs">protected</span>
                ) : (
                  <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => onRemove(u.email || u.id)}>Remove</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

