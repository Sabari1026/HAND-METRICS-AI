import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserScans } from '../services/api'
import ReportCard from '../components/ReportCard'
import { generatePDF } from '../utils/pdf'

export default function Report({ user }) {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try sessionStorage first (instant), then fall back to API fetch
    const cached = sessionStorage.getItem('scan_' + scanId)
    if (cached) {
      setScan(JSON.parse(cached))
      setLoading(false)
      return
    }
    getUserScans(user.email).then(scans => {
      const found = scans.find(s => s.id === scanId)
      setScan(found || null)
    }).catch(() => setScan(null)).finally(() => setLoading(false))
  }, [scanId, user])

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-white font-semibold">Scan not found</p>
          <button className="btn-secondary mt-4" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  function handleDownload() {
    generatePDF(scan, user.email)
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-400 hover:text-white mb-2 flex items-center gap-1 transition"
            >
              ← Dashboard
            </button>
            <h1 className="text-3xl font-bold text-white">📋 Hand Scan Report</h1>
            <p className="text-slate-400 text-sm mt-1">
              {new Date(scan.scan_date).toLocaleString()} — {scan.hand_orientation || 'Unknown'} Hand
            </p>
          </div>
          <button onClick={handleDownload} className="btn-primary">
            ⬇️ Download PDF
          </button>
        </div>

        <ReportCard scan={scan} userEmail={user.email} />
      </div>
    </div>
  )
}
