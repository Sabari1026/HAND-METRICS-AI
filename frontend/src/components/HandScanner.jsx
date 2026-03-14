import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import Webcam from 'react-webcam'

const VIDEO_CONSTRAINTS = {
  width: 1280,
  height: 720,
  facingMode: 'user'
}

/**
 * HandScanner Component
 * Reusable webcam wrapper with custom scanning UI overlays.
 */
const HandScanner = forwardRef((props, ref) => {
  const webcamRef = useRef(null)

  useImperativeHandle(ref, () => ({
    getScreenshot: () => webcamRef.current?.getScreenshot()
  }))

  return (
    <div className="relative w-full h-full bg-dark-900 overflow-hidden">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={VIDEO_CONSTRAINTS}
        className="w-full h-full object-cover"
      />
      
      {/* Scanning UI Overlays */}
      <div className="absolute inset-0 pointer-events-none border-[16px] border-dark-900/40">
        <div className="w-full h-full relative">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-brand-500 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-brand-500 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-brand-500 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-brand-500 rounded-br-lg" />
          
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-400/50 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_3s_linear_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
})

export default HandScanner
