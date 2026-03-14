import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { analyzeFrame } from '../services/api'
import { supabase } from '../services/supabaseClient'

import HandScanner from '../components/HandScanner'

const FINGER_LABELS = [
  ['thumb_length',  '👍 Thumb'],
  ['index_length',  '☝️ Index'],
  ['middle_length', '🖕 Middle'],
  ['ring_length',   '💍 Ring'],
  ['pinky_length',  '🤙 Pinky'],
]

export default function LiveScan({ user }) {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const [active, setActive] = useState(false)
  const [measurements, setMeasurements] = useState(null)
  const [detected, setDetected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)
  const frameCount = useRef(0)

  const capture = useCallback(async () => {
    if (!scannerRef.current) return
    const screenshot = scannerRef.current.getScreenshot()
    if (!screenshot) return
    frameCount.current += 1

    try {
      const data = await analyzeFrame(screenshot)
      if (data.detected && data.measurements) {
        setDetected(true)
        setMeasurements(data.measurements)
      } else {
        setDetected(false)
      }
    } catch {
      // Silent – don't spam errors during live scan
    }
  }, [])

  function startScan() {
    setActive(true)
    setMeasurements(null)
    setSaved(null)
    setError('')
    frameCount.current = 0
    intervalRef.current = setInterval(capture, 1000) // 1 fps
  }

  function stopScan() {
    setActive(false)
    clearInterval(intervalRef.current)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  async function saveScan() {
    if (!measurements) return
    setSaving(true)
    setError('')
    try {
      const row = {
        user_email: user.email,
        scan_date: new Date().toISOString(),
        thumb_length: measurements.thumb_length,
        index_length: measurements.index_length,
        middle_length: measurements.middle_length,
        ring_length: measurements.ring_length,
        pinky_length: measurements.pinky_length,
        palm_width: measurements.palm_width,
        palm_height: measurements.palm_height,
        hand_orientation: measurements.hand_orientation,
        finger_angles: measurements.finger_angles,
        video_url: '',
      }
      const { data, error: err } = await supabase.from('hand_scans').insert(row).select().single()
      if (err) throw err
      setSaved(data)
      sessionStorage.setItem('scan_' + data.id, JSON.stringify(data))
    } catch (e) {
      setError('Save failed: ' + (e.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const m = measurements

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold text-white mb-1">📷 Live Hand Scanner</h1>
          <p className="text-slate-400">Show your hand to the camera — AI detects landmarks in real-time.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Webcam panel */}
          <div className="card overflow-hidden">
            <div className="relative bg-dark-900 aspect-video">
              <HandScanner ref={scannerRef} />

              {/* Status badge Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-4">
                {active && (
                  <span className={`badge ${detected ? 'bg-emerald-500/90 text-white' : 'bg-red-500/80 text-white'} shadow-lg`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {detected ? 'Hand Detected' : 'No Hand Detected'}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex gap-3">
              {!active ? (
                <button onClick={startScan} className="btn-primary flex-1">
                  ▶️ Start Scanning
                </button>
              ) : (
                <button onClick={stopScan} className="btn-danger flex-1 text-base py-3">
                  ⏹️ Stop Scanning
                </button>
              )}
            </div>

            {active && (
              <div className="px-4 pb-4 text-xs text-slate-500 text-center">
                Sending 1 frame/sec to the AI backend • {frameCount.current} frames processed
              </div>
            )}
          </div>

          {/* Measurements panel */}
          <div className="card p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white mb-4">Live Measurements</h2>

            {!m ? (
              <div className="flex-1 flex items-center justify-center text-center text-slate-500">
                <div>
                  <div className="text-5xl mb-3">🖐️</div>
                  <p>Start scanning then hold your hand open in front of the camera.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {m.hand_orientation} Hand
                  </span>
                </div>

                {FINGER_LABELS.map(([key, label]) => {
                  const val = m[key] || 0
                  const pct = Math.min((val / 0.35) * 100, 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{label}</span>
                        <span className="font-mono text-brand-300">{val.toFixed(4)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="measurement-bar h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-slate-400">Palm Width</div>
                    <div className="font-mono text-white">{(m.palm_width || 0).toFixed(4)}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs text-slate-400">Palm Height</div>
                    <div className="font-mono text-white">{(m.palm_height || 0).toFixed(4)}</div>
                  </div>
                </div>

                {/* Angles */}
                {m.finger_angles && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-xs text-slate-400 mb-2">Joint Angles (°)</div>
                    <div className="grid grid-cols-5 gap-1">
                      {Object.entries(m.finger_angles).map(([f, angle]) => (
                        <div key={f} className="bg-white/5 rounded-lg p-2 text-center">
                          <div className="text-[10px] text-slate-400 capitalize">{f}</div>
                          <div className="text-xs font-mono text-white">{angle?.toFixed(1)}°</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-300 bg-red-500/10 rounded-xl px-3 py-2">
                    ⚠️ {error}
                  </div>
                )}

                {saved ? (
                  <button
                    className="btn-secondary w-full"
                    onClick={() => navigate(`/report/${saved.id}`)}
                  >
                    📋 View Full Report
                  </button>
                ) : (
                  <button
                    className="btn-primary w-full"
                    onClick={saveScan}
                    disabled={saving}
                  >
                    {saving
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
                      : '💾 Save This Scan'
                    }
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
