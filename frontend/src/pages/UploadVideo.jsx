import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeVideo } from '../services/api'

const ACCEPT = 'video/mp4,video/webm,video/avi,video/quicktime'

export default function UploadVideo({ user }) {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()

  function handleFile(f) {
    if (!f || !f.type.startsWith('video/')) {
      setError('Please select a valid video file.')
      return
    }
    setFile(f)
    setResult(null)
    setError('')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setProgress(0)

    // Fake progress animation while waiting
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 12, 90))
    }, 400)

    try {
      const data = await analyzeVideo(file, user.email)
      clearInterval(interval)
      setProgress(100)
      setResult(data)
      // Cache for Report page
      if (data.scan_id) {
        sessionStorage.setItem('scan_' + data.scan_id, JSON.stringify({
          id: data.scan_id,
          user_email: user.email,
          scan_date: new Date().toISOString(),
          video_url: data.video_url,
          ...data.measurements,
        }))
      }
    } catch (err) {
      clearInterval(interval)
      setError(err.response?.data?.error || 'Analysis failed. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const m = result?.measurements

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold text-white mb-1">📤 Upload Hand Video</h1>
          <p className="text-slate-400">Upload an MP4, WebM or MOV video of your hand for full AI analysis.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <div
            className={`card p-10 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
              dragging
                ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
                : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/20 hover:border-brand-500/50 hover:bg-white/5'
            }`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-emerald-300">{file.name}</p>
                <p className="text-sm text-slate-400 mt-1">{(file.size / 1e6).toFixed(2)} MB — click to change</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4 animate-bounce">🎬</div>
                <p className="font-semibold text-white">Drag & drop your video here</p>
                <p className="text-sm text-slate-400 mt-1">or click to browse — MP4, WebM, MOV, AVI</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              ⚠️ {error}
            </div>
          )}

          {/* Progress bar */}
          {loading && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Processing video…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="measurement-bar h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">MediaPipe is detecting hand landmarks on each frame…</p>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={!file || loading}>
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</span>
              : '🔬 Analyze Hand'
            }
          </button>
        </form>

        {/* Results */}
        {result && m && (
          <div className="mt-8 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">✅ Analysis Complete</h2>
              {result.scan_id && (
                <button
                  onClick={() => navigate(`/report/${result.scan_id}`)}
                  className="btn-secondary text-sm"
                >
                  📋 View Full Report
                </button>
              )}
            </div>

            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {m.hand_orientation} Hand
                </span>
              </div>

              {/* Measurement bars */}
              <div className="space-y-3">
                {[
                  ['👍 Thumb',  m.thumb_length],
                  ['☝️ Index',  m.index_length],
                  ['🖕 Middle', m.middle_length],
                  ['💍 Ring',   m.ring_length],
                  ['🤙 Pinky',  m.pinky_length],
                ].map(([label, val]) => {
                  const max = 0.35
                  const pct = Math.min((val / max) * 100, 100)
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{label}</span>
                        <span className="font-mono text-brand-300">{Number(val).toFixed(4)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="measurement-bar h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-xs text-slate-400">Palm Width</div>
                  <div className="font-mono text-white font-semibold">{Number(m.palm_width).toFixed(4)}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-xs text-slate-400">Palm Height</div>
                  <div className="font-mono text-white font-semibold">{Number(m.palm_height).toFixed(4)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
