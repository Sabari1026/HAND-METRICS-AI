import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUserScans, deleteScan } from '../services/api'

const STATS = (scans) => [
  { label: 'Total Scans',  value: scans.length,  icon: '📋' },
  { label: 'Avg Palm Width', value: scans.length
      ? (scans.reduce((s, x) => s + (x.palm_width || 0), 0) / scans.length).toFixed(4)
      : '—',
    icon: '📏' },
  { label: 'Hand Types', value: [...new Set(scans.map(s => s.hand_orientation).filter(Boolean))].join(', ') || '—', icon: '🖐️' },
]

function ScanRow({ scan, onDelete, onView }) {
  const date = new Date(scan.scan_date).toLocaleString()
  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-brand-500/40 transition-all duration-200 animate-fade-in">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🖐️</span>
          <span className="font-semibold text-white truncate">{scan.hand_orientation || 'Unknown'} Hand</span>
          <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {date}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {[
            ['Thumb', scan.thumb_length],
            ['Index', scan.index_length],
            ['Middle', scan.middle_length],
            ['Ring', scan.ring_length],
            ['Pinky', scan.pinky_length],
          ].map(([name, val]) => val != null && (
            <span key={name}><span className="text-slate-500">{name}:</span> {Number(val).toFixed(4)}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onView(scan)} className="btn-secondary text-sm px-4 py-2">
          📊 Report
        </button>
        <button onClick={() => onDelete(scan.id)} className="btn-danger">
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}

export default function Dashboard({ user }) {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getUserScans(user.email)
      setScans(data)
    } catch (e) {
      setError('Could not load scans. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this scan?')) return
    try {
      await deleteScan(id)
      setScans(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Failed to delete scan.')
    }
  }

  function handleView(scan) {
    // Store in sessionStorage for the Report page
    sessionStorage.setItem('scan_' + scan.id, JSON.stringify(scan))
    window.location.href = `/report/${scan.id}`
  }

  const stats = STATS(scans)

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, <span className="gradient-text">{user.email.split('@')[0]}</span> 👋
          </h1>
          <p className="text-slate-400">Manage and analyze your hand scans.</p>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link to="/upload" className="card p-5 flex items-center gap-4 hover:border-brand-500/50 hover:glow-brand transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📤
            </div>
            <div>
              <div className="font-semibold text-white">Upload Video</div>
              <div className="text-sm text-slate-400">Analyze a hand video file</div>
            </div>
          </Link>
          <Link to="/live" className="card p-5 flex items-center gap-4 hover:border-violet-500/50 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
              📷
            </div>
            <div>
              <div className="font-semibold text-white">Live Scan</div>
              <div className="text-sm text-slate-400">Real-time webcam detection</div>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scan history */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Scan History</h2>
            <button onClick={load} className="text-sm text-brand-400 hover:text-brand-300 transition">
              🔄 Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && scans.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-5xl mb-3">🖐️</div>
              <p className="font-medium">No scans yet</p>
              <p className="text-sm mt-1">Upload a video or try the live scanner.</p>
            </div>
          )}

          <div className="space-y-3">
            {scans.map(scan => (
              <ScanRow key={scan.id} scan={scan} onDelete={handleDelete} onView={handleView} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
