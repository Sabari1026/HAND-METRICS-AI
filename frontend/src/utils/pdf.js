import { jsPDF } from 'jspdf'

/**
 * Generate and download a PDF report for a hand scan.
 * @param {object} scan 
 * @param {string} userEmail 
 */
export function generatePDF(scan, userEmail) {
  const doc = new jsPDF()
  const dateStr = new Date(scan.scan_date).toLocaleString()
  
  // Header
  doc.setFillColor(99, 102, 241) // Brand purple
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('HandMetrics AI Report', 20, 25)
  
  doc.setFontSize(10)
  doc.text(`Generated for: ${userEmail}`, 20, 34)

  // Meta Info
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(12)
  doc.text('Scan Details', 20, 55)
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 58, 190, 58)

  doc.setFontSize(10)
  doc.text(`Date/Time: ${dateStr}`, 25, 68)
  doc.text(`Hand Orientation: ${scan.hand_orientation || 'Unknown'}`, 25, 75)
  doc.text(`Internal ID: ${scan.id}`, 25, 82)

  // Measurements Section
  doc.setFontSize(12)
  doc.text('Finger Lengths (Normalised)', 20, 100)
  doc.line(20, 103, 190, 103)

  const fingers = [
    { n: 'Thumb', v: scan.thumb_length },
    { n: 'Index', v: scan.index_length },
    { n: 'Middle', v: scan.middle_length },
    { n: 'Ring', v: scan.ring_length },
    { n: 'Pinky', v: scan.pinky_length },
  ]

  let y = 113
  fingers.forEach(f => {
    doc.text(f.n, 30, y)
    doc.text((f.v || 0).toFixed(6), 160, y)
    y += 10
  })

  // Palm Section
  doc.setFontSize(12)
  doc.text('Palm Measurements', 20, 175)
  doc.line(20, 178, 190, 178)

  doc.setFontSize(10)
  doc.text('Palm Width:', 30, 188)
  doc.text((scan.palm_width || 0).toFixed(6), 160, 188)
  doc.text('Palm Height:', 30, 198)
  doc.text((scan.palm_height || 0).toFixed(6), 160, 198)

  // Angles Section
  if (scan.finger_angles) {
    doc.setFontSize(12)
    doc.text('Finger Angles (Degrees)', 20, 218)
    doc.line(20, 221, 190, 221)

    const angles = typeof scan.finger_angles === 'string' 
      ? JSON.parse(scan.finger_angles) 
      : scan.finger_angles

    let ay = 231
    Object.entries(angles).forEach(([name, angle]) => {
      doc.text(name.charAt(0).toUpperCase() + name.slice(1), 30, ay)
      doc.text(`${(angle || 0).toFixed(2)}°`, 160, ay)
      ay += 8
    })
  }

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Disclaimer: These measurements are calculated based on AI landmark detection and are not intended for medical use.', 20, 285)

  // Save the PDF
  const filename = `HandMetrics_Report_${scan.id.substring(0, 8)}.pdf`
  doc.save(filename)
}
