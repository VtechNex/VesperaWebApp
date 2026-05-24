import React, { useEffect, useMemo, useState } from 'react'
import { Input } from '../../../components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import ADMIN from '../../../services/adminService'
import { useToast } from '../../../hooks/use-toast'

function DarkSelect({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`appearance-none bg-[#0d0d0d] border border-white/20 text-white rounded-md px-3 py-2 pr-10 text-[11px] md:text-xs min-h-10 shadow-inner [color-scheme:dark] focus:outline-none focus:border-[#D4AF37]/70 focus:ring-1 focus:ring-[#D4AF37]/40 ${className}`}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  )
}

export default function ManageUsers() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
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
      const response = await ADMIN.FETCH_USERS()
      if (response && response.status === 200) {
        setUsers(response.data.data || [])
      }
    }
    fetchUsers()
  }, [])

  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((user) => user.role === 'admin').length
    const owners = users.filter((user) => user.role === 'owner').length
    const managers = users.filter((user) => user.role === 'manager').length
    const l1 = users.filter((user) => user.role === 'l1').length
    const l2 = users.filter((user) => user.role === 'l2').length
    return { total, admins, owners, managers, l1, l2 }
  }, [users])

  const filteredUsers = useMemo(() => {
    let data = [...users]
    if (roleFilter !== 'all') data = data.filter((user) => user.role === roleFilter)
    if (search.trim()) {
      const query = search.toLowerCase()
      data = data.filter((user) => {
        const username = String(user.username || '').toLowerCase()
        const email = String(user.email || '').toLowerCase()
        return username.includes(query) || email.includes(query)
      })
    }
    return data
  }, [roleFilter, search, users])

  const roleLabel = (role, fallback) => {
    if (role === 'admin') return 'Admin'
    if (role === 'owner') return 'Account Owner'
    if (role === 'manager') return 'Manager'
    if (role === 'l1') return 'L1 User'
    if (role === 'l2') return 'L2 User'
    return fallback || 'User'
  }

  const resetNewUser = () => {
    setNewUser({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      role: 'manager',
    })
  }

  const handleOpenDialog = () => {
    resetNewUser()
    setIsDialogOpen(true)
  }

  const handleCreateUser = async () => {
    const response = await ADMIN.CREATE_USER(newUser)
    if (response && response.status === 201) {
      setUsers((prev) => [...prev, response.data.data])
      toast({
        title: 'User created',
        description: `${newUser.username} was added successfully.`,
      })
    } else {
      toast({
        title: 'Create failed',
        description: response?.data?.message || 'Unable to create user.',
      })
    }
    setIsDialogOpen(false)
  }

  const handleActionClick = (event, user) => {
    event.stopPropagation()
    setSelectedUser(user)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
  }

  const handleDeleteUser = async () => {
    if (!selectedUser || deleteLoading) return

    try {
      setDeleteLoading(true)
      const response = await ADMIN.DELETE_USER(selectedUser.id)
      if (response && response.status === 200) {
        setUsers((prev) => prev.filter((user) => String(user.id) !== String(selectedUser.id)))
        toast({
          title: 'User deleted',
          description: `${selectedUser.username} was removed successfully.`,
        })
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        return
      }

      toast({
        title: 'Delete failed',
        description: response?.data?.message || 'Unable to delete user.',
      })
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error',
      })
    } finally {
      setDeleteLoading(false)
      setContextMenu(null)
    }
  }

  const handleUpdateClick = () => {
    if (!selectedUser) return
    setUpdateUser({
      username: selectedUser.username || '',
      email: selectedUser.email || '',
      role: selectedUser.role || 'manager',
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
          prev.map((user) => (String(user.id) === String(selectedUser.id) ? response.data.data : user))
        )
        toast({
          title: 'User updated',
          description: `${selectedUser.username} was updated successfully.`,
        })
      } else {
        toast({
          title: 'Update failed',
          description: response?.data?.message || 'Unable to update user.',
        })
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error?.response?.data?.message || error?.message || 'Unknown error',
      })
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
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user by username or email" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
        </div>
        <div className="flex items-center gap-2 text-[11px] md:text-xs">
          <span className="text-white/60">Filter by role:</span>
          <DarkSelect value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="min-w-[160px]">
            <option value="all">-- All Roles --</option>
            <option value="admin">Admin</option>
            <option value="owner">Account Owner</option>
            <option value="manager">Manager</option>
            <option value="l1">L1 User</option>
            <option value="l2">L2 User</option>
          </DarkSelect>
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
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-white/10 text-white/80 bg-black/40 hover:bg-black/70 transition-colors">
                    <td className="px-3 py-2">
                      <button
                        onClick={(event) => handleActionClick(event, user)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/5 border border-white/15 text-white/70 text-xs hover:bg-white/10 transition cursor-pointer"
                      >
                        ...
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">{user.username}</td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">{user.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">{roleLabel(user.role)}</td>
                    <td className="px-3 py-2 whitespace-nowrap align-top">
                      <span className={`px-2 py-1 rounded-full text-[9px] ${user.is_active ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap align-top text-[10px]">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/90 p-6 text-white">
          <DialogTitle className="text-lg font-semibold text-white">Add New User</DialogTitle>
          <DialogDescription className="mb-4 text-sm text-white/70">
            Fill in the details below to create a new user account.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Username</label>
              <Input value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} placeholder="Enter username" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Email</label>
              <Input value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} placeholder="Enter email address" type="email" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
              <Input value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} placeholder="Enter password" type="password" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Role</label>
              <DarkSelect value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} className="w-full">
                <option value="admin">Admin</option>
                <option value="owner">Account Owner</option>
                <option value="manager">Manager</option>
                <option value="l1">L1 User</option>
                <option value="l2">L2 User</option>
              </DarkSelect>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleCreateUser} className="text-xs md:text-sm">Create User</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/90 p-6 text-white">
          <DialogTitle className="text-lg font-semibold text-white">Update User</DialogTitle>
          <DialogDescription className="mb-4 text-sm text-white/70">
            Update user information for {selectedUser?.username}
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Username</label>
              <Input value={updateUser.username} onChange={(event) => setUpdateUser({ ...updateUser, username: event.target.value })} placeholder="Enter username" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Email</label>
              <Input value={updateUser.email} onChange={(event) => setUpdateUser({ ...updateUser, email: event.target.value })} placeholder="Enter email address" type="email" className="bg-black/40 border-white/20 text-xs md:text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Role</label>
              <DarkSelect value={updateUser.role} onChange={(event) => setUpdateUser({ ...updateUser, role: event.target.value })} className="w-full">
                <option value="admin">Admin</option>
                <option value="owner">Account Owner</option>
                <option value="manager">Manager</option>
                <option value="l1">L1 User</option>
                <option value="l2">L2 User</option>
              </DarkSelect>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setIsUpdateDialogOpen(false)} variant="outline" className="text-xs md:text-sm">Cancel</Button>
            <Button onClick={handleUpdateUser} className="text-xs md:text-sm">Update User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleCloseContextMenu} />
          <div
            className="fixed z-50 overflow-hidden rounded-lg border border-white/20 bg-black shadow-xl"
            style={{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
            }}
          >
            <button
              onClick={handleUpdateClick}
              className="w-full px-4 py-2 text-left text-sm text-white transition hover:bg-white/10 whitespace-nowrap"
            >
              Update User
            </button>
            <button
              onClick={() => {
                setDeleteDialogOpen(true)
                setContextMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/20 whitespace-nowrap border-t border-white/10"
            >
              Delete User
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (deleteLoading) return
          setDeleteDialogOpen(open)
          if (!open) {
            setSelectedUser(null)
          }
        }}
        title="Delete User?"
        description="This action cannot be undone. Are you sure you want to delete this user?"
        details={
          selectedUser ? (
            <div className="space-y-1">
              <div className="font-medium text-white">{selectedUser.username || 'Unknown user'}</div>
              <div className="text-white/60">{selectedUser.email || '-'}</div>
              <div className="text-xs text-white/50">{roleLabel(selectedUser.role)}</div>
            </div>
          ) : null
        }
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
        destructive
      />
    </div>
  )
}
