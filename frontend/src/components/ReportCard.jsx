import React from 'react'

const FINGERS = [
  { key: 'thumb_length',  label: 'Thumb',  icon: '👍', max: 0.3 },
  { key: 'index_length',  label: 'Index',  icon: '☝️', max: 0.35 },
  { key: 'middle_length', label: 'Middle', icon: '🖕', max: 0.35 },
  { key: 'ring_length',   label: 'Ring',   icon: '💍', max: 0.35 },
  { key: 'pinky_length',  label: 'Pinky',  icon: '🤙', max: 0.25 },
]

export default function ReportCard({ scan, userEmail }) {
  if (!scan) return null

  // finger_angles might be a JSON string or object depending on how Supabase returns it
  const angles = typeof scan.finger_angles === 'string' 
    ? JSON.parse(scan.finger_angles) 
    : scan.finger_angles || {}

  return (
    <div className="card p-6 sm:p-8 space-y-8 animate-fade-in">
      {/* User Info Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 text-sm">
        <div className="space-y-1">
          <div className="text-slate-500 font-medium">SCAN PERFORMED FOR</div>
          <div className="text-white font-semibold text-lg">{userEmail}</div>
        </div>
        <div className="sm:text-right space-y-1">
          <div className="text-slate-500 font-medium">SCAN ID</div>
          <div className="text-white font-mono text-xs">{scan.id}</div>
        </div>
      </div>

      {/* Main Measurements Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Col: Finger Lengths */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            📏 Finger Lengths
          </h3>
          <div className="space-y-4 pt-2">
            {FINGERS.map(f => {
              const val = scan[f.key] || 0
              const pct = Math.min((val / f.max) * 100, 100)
              return (
                <div key={f.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300 flex items-center gap-2">
                      <span className="text-lg">{f.icon}</span> {f.label}
                    </span>
                    <span className="font-mono text-brand-400 font-bold">{val.toFixed(4)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className="measurement-bar h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Col: Palm & Angles */}
        <div className="space-y-8">
          {/* Palm Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🤚 Palm Dimensions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Width</div>
                <div className="text-2xl font-bold text-white font-mono">{(scan.palm_width || 0).toFixed(4)}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Height</div>
                <div className="text-2xl font-bold text-white font-mono">{(scan.palm_height || 0).toFixed(4)}</div>
              </div>
            </div>
          </div>

          {/* Finger Angles */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📐 Finger Tip Angles
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(angles).map(([finger, angle]) => (
                <div key={finger} className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">{finger}</div>
                  <div className="text-sm font-bold text-brand-300 font-mono">{(angle || 0).toFixed(1)}°</div>
                </div>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div className="pt-4">
            <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Hand Orientation</div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-bold ${
              scan.hand_orientation === 'Left' 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
            }`}>
              {scan.hand_orientation === 'Left' ? '👈' : '👉'} {scan.hand_orientation || 'Unknown'} Hand
            </div>
          </div>
        </div>

      </div>

      {/* Video Source ID if exists */}
      {scan.video_url && (
        <div className="pt-6 border-t border-white/10 text-xs text-slate-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Source Video: <a href={scan.video_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">{scan.video_url}</a>
        </div>
      )}
    </div>
  )
}
