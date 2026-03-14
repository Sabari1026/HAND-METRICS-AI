import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

const LINKS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard',   desc: 'View your scan history' },
  { to: '/upload',   icon: '📤', label: 'Upload Video', desc: 'Analyze a hand video file' },
  { to: '/live',     icon: '📷', label: 'Live Scan',    desc: 'Use your webcam in real-time' },
]

export default function Navbar({ user }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-dark-800/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🖐️</span>
          <span className="font-bold text-lg gradient-text hidden sm:block">HandMetrics AI</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300
                         hover:text-white hover:bg-white/8 transition-all duration-150"
            >
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 max-w-[160px] truncate">{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-400
                       hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                       transition-all duration-150"
          >
            <span>🚪</span>
            <span className="hidden sm:block">Sign Out</span>
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            onClick={() => setOpen(o => !o)}
          >
            <span className="text-lg">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-dark-800/90 backdrop-blur px-4 py-3 space-y-1 animate-fade-in">
          {LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition"
            >
              <span className="text-xl">{l.icon}</span>
              <div>
                <div className="text-sm font-medium text-white">{l.label}</div>
                <div className="text-xs text-slate-400">{l.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
