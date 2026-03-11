import React, { useState, useMemo, useEffect } from 'react'
import { Input } from '../../../components/ui/input'
import { Dialog, DialogTitle, DialogDescription, DialogContent, DialogHeader } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import ADMIN from '../../../services/adminService'

export default function ManageUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    role: 'manager',
  })
  const [updateUser, setUpdateUser] = useState({
    username: '',
    email: '',
    role: 'manager',
  })

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await ADMIN.FETCH_USERS();
      if (response && response.status === 200) {
        setUsers(response.data.data);
      }
    }
    fetchUsers()
  }, []);

  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((u) => u.role === 'admin').length
    const owners = users.filter((u) => u.role === 'owner').length
    const managers = users.filter((u) => u.role === 'manager').length
    const l1 = users.filter((u) => u.role === 'l1').length
    const l2 = users.filter((u) => u.role === 'l2').length
    return { total, admins, owners, managers, l1, l2 }
  }, [users])

  const filteredUsers = useMemo(() => {
    let data = [...users]
    if (roleFilter !== 'all') data = data.filter((u) => u.role === roleFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter((u) => {
        const username = (u.username || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        return (
          username.includes(q) || email.includes(q)
        )
      })
    }
    return data
  }, [users, search, roleFilter])

  const roleLabel = (role, fallback) => {
    if (role === 'admin') return 'Admin'
    if (role === 'owner') return 'Account Owner'
    if (role === 'manager') return 'Manager'
    if (role === 'l1') return 'L1 User'
    if (role === 'l2') return 'L2 User'
    return fallback || 'User'
  }

  const badgeClass = (variant) => {
    if (variant === 'owner')
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/60'
    if (variant === 'you') return 'bg-sky-500/15 text-sky-200 border border-sky-400/60'
    return 'bg-white/10 text-white/70 border border-white/20'
  }

  const handleOpenDialog = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: 'manager',
    })
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleCreateUser = async () => {
    console.log('Creating user:', newUser)
    const response = await ADMIN.CREATE_USER(newUser);
    if (response && response.status === 201) {
      setUsers((prev) => [...prev, response.data.data]);
    }
    setIsDialogOpen(false)
  }

  const handleActionClick = (e, user) => {
    e.stopPropagation()
    setSelectedUser(user)
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    })
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${selectedUser.username}"? This action cannot be undone.`
    )
    
    if (!confirmed) {
      setContextMenu(null)
      return
    }

    try {
      const response = await ADMIN.DELETE_USER(selectedUser.id)
      if (response && response.status === 200) {
        setUsers((prev) => prev.filter(u => String(u.id) !== String(selectedUser.id)))
        alert('User deleted successfully')
      }
    } catch (err) {
      alert('Failed to delete user: ' + (err?.message || 'Unknown error'))
    }
    setContextMenu(null)
  }

  const handleUpdateClick = () => {
    if (!selectedUser) return
    setUpdateUser({
      username: selectedUser.username,
      email: selectedUser.email,
      role: selectedUser.role,
    })
    setIsUpdateDialogOpen(true)
    setContextMenu(null)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await ADMIN.UPDATE_USER(selectedUser.id, updateUser)
      if (response && response.status === 200) {
        setUsers((prev) =>
          prev.map(u => String(u.id) === String(selectedUser.id) ? response.data.data : u)
        )
        alert('User updated successfully')
      }
    } catch (err) {
      alert('Failed to update user: ' + (err?.message || 'Unknown error'))
    }
    setIsUpdateDialogOpen(false)
    setSelectedUser(null)
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  return (
    <div className="min-h-screen bg-black text-white space-y-5 fade-in">
      <div className="rounded-2xl card-surface border border-white/10 p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-[#D4AF37]">Manage Users</h1>
          <p className="text-xs md:text-sm text-white/60">View and manage team members who can access your Vespera Estates CRM.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] md:text-xs text-white/70">
          <div className="px-3 py-1.5 rounded-full border border-white/15 bg-black/40">Number of users: <span className="text-gold font-semibold">{stats.total}</span></div>
          <div className="px-3 py-1.5 rounded-full border border-white/15 bg-black/40">Admins: <span className="text-gold font-semibold">{stats.admins}</span></div>
          <div className="px-3 py-1.5 rounded-full border border-white/15 bg-black/40">Owners: <span className="text-gold font-semibold">{stats.owners}</span></div>
          <div className="px-3 py-1.5 rounded-full border border-white/15 bg-black/40">Managers: <span className="text-gold font-semibold">{stats.managers}</span></div>
          <div className="px-3 py-1.5 rounded-full border border-white/15 bg-black/40">L1: <span className="text-gold font-semibold">{stats.l1}</span></div>
          <div className="px-3 py-1.5 rounded-full border border-white/15 bg-black/40">L2: <span className="text-gold font-semibold">{stats.l2}</span></div>
        </div>
      </div>

      <div className="rounded-2xl card-surface border border-white/10 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 flex items-center gap-2 min-w-[220px]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user by username or email" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
        </div>
        <div className="flex items-center gap-2 text-[11px] md:text-xs">
          <span className="text-white/60">Filter by role:</span>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-black/40 border border-white/20 text-white rounded-md px-3 py-2 text-[11px] md:text-xs min-w-[130px]">
            <option value="all">-- All Roles --</option>
            <option value="admin">Admin</option>
            <option value="owner">Account Owner</option>
            <option value="manager">Manager</option>
            <option value="l1">L1 User</option>
            <option value="l2">L2 User</option>
          </select>
        </div>
      </div>

      <div className="card-surface rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between text-[11px] md:text-xs text-white/70">
          <span>Total Users: <span className="text-gold font-semibold">{filteredUsers.length}</span></span>
          <Button onClick={handleOpenDialog} className="text-xs md:text-sm">+ Add New User</Button>
        </div>
        <div className="overflow-x-auto" onClick={handleCloseContextMenu}>
          <table className="min-w-full text-[11px] md:text-xs">
            <thead className="bg-black/70 text-white/60">
              <tr>
                <th className="px-3 py-2 text-left w-14">Action</th>
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-white/60 bg-black/40">No users found.</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-white/10 text-white/80 bg-black/40 hover:bg-black/70 transition-colors">
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => handleActionClick(e, u)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 border border-white/15 text-white/70 text-xs hover:bg-white/10 transition cursor-pointer"
                      >
                        ⋮
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">{u.username}</td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">{u.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">{roleLabel(u.role)}</td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">
                      <span className={`px-2 py-1 rounded-full text-[9px] ${u.is_active ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap align-top text-[10px]">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold text-white">Add New User</DialogTitle>
          <DialogDescription className="text-sm text-white/70 mb-4">
            Fill in the details below to create a new user account.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Username</label>
              <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="Enter username" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Email</label>
              <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="Enter email address" type="email" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
              <Input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Enter password" type="password" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="bg-black/40 border border-white/20 text-white rounded-md px-3 py-2 text-[11px] md:text-xs w-full">
                <option value="admin">Admin</option>
                <option value="owner">Account Owner</option>
                <option value="manager">Manager</option>
                <option value="l1">L1 User</option>
                <option value="l2">L2 User</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={handleCloseDialog} variant="outline" className="text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleCreateUser} className="text-xs md:text-sm">Create User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update User Dialog */}
      <Dialog open={isUpdateDialogOpen} onClose={() => setIsUpdateDialogOpen(false)}>
        <DialogContent>
          <DialogTitle className="text-lg font-semibold text-white">Update User</DialogTitle>
          <DialogDescription className="text-sm text-white/70 mb-4">
            Update user information for {selectedUser?.username}
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Username</label>
              <Input value={updateUser.username} onChange={(e) => setUpdateUser({ ...updateUser, username: e.target.value })} placeholder="Enter username" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Email</label>
              <Input value={updateUser.email} onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value })} placeholder="Enter email address" type="email" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Role</label>
              <select value={updateUser.role} onChange={(e) => setUpdateUser({ ...updateUser, role: e.target.value })} className="bg-black/40 border border-white/20 text-white rounded-md px-3 py-2 text-[11px] md:text-xs w-full">
                <option value="admin">Admin</option>
                <option value="owner">Account Owner</option>
                <option value="manager">Manager</option>
                <option value="l1">L1 User</option>
                <option value="l2">L2 User</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setIsUpdateDialogOpen(false)} variant="outline" className="text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleUpdateUser} className="text-xs md:text-sm">Update User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Overlay to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseContextMenu}
          />
          {/* Context Menu */}
          <div
            className="fixed z-50 bg-black border border-white/20 rounded-lg shadow-xl overflow-hidden"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
            }}
          >
            <button
              onClick={handleUpdateClick}
              className="w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition text-left flex items-center gap-2 whitespace-nowrap"
            >
              <span>✏️</span> Update User
            </button>
            <button
              onClick={handleDeleteUser}
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition text-left flex items-center gap-2 whitespace-nowrap border-t border-white/10"
            >
              <span>🗑️</span> Delete User
            </button>
          </div>
        </>
      )}
    </div>
  )
}
