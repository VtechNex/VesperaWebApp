import React from 'react'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../context/AuthProvider'
import { useNavigate } from 'react-router-dom'
import SiteHeader from '../../components/layout/SiteHeader'
import SiteFooter from '../../components/layout/SiteFooter'

export default function Customer() {
  const { user, signout } = useAuth()
  const navigate = useNavigate()
  const onLogout = () => { signout(); navigate('/') }
  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader authMode="dashboard" onLogout={onLogout} />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="h2-section">Customer Handling Team Dashboard</h1>
            <div className="text-white/70 text-sm">Signed in as {user?.name} ({user?.role})</div>
          </div>
          <Button className="border border-white/20 bg-white/10 hover:bg-white/15" onClick={onLogout}>Logout</Button>
        </header>
        <main className="mt-8 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-white/80">Welcome to Customer Handling. Build your widgets here.</div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}

