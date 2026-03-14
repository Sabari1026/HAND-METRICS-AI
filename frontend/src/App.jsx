import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './services/supabaseClient'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UploadVideo from './pages/UploadVideo'
import LiveScan from './pages/LiveScan'
import Report from './pages/Report'
import Navbar from './components/Navbar'

// ── Auth guard ──────────────────────────────────────────────────────────
function RequireAuth({ user, children }) {
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      {user && <Navbar user={user} />}
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/dashboard" element={
          <RequireAuth user={user}><Dashboard user={user} /></RequireAuth>
        } />
        <Route path="/upload" element={
          <RequireAuth user={user}><UploadVideo user={user} /></RequireAuth>
        } />
        <Route path="/live" element={
          <RequireAuth user={user}><LiveScan user={user} /></RequireAuth>
        } />
        <Route path="/report/:scanId" element={
          <RequireAuth user={user}><Report user={user} /></RequireAuth>
        } />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
