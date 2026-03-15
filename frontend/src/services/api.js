import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({ baseURL: BASE })

/**
 * Upload a hand video for full analysis.
 * @param {File}   videoFile
 * @param {string} userEmail
 */
export async function analyzeVideo(videoFile, userEmail) {
  const fd = new FormData()
  fd.append('video', videoFile)
  fd.append('user_email', userEmail)
  const { data } = await api.post('/analyze', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Analyze a single base64-encoded JPEG frame (live scan).
 * @param {string} base64Frame  – data URI or raw base64
 */
export async function analyzeFrame(base64Frame) {
  const { data } = await api.post('/analyze-frame', { frame: base64Frame })
  return data
}

/**
 * Fetch all saved scans for a user.
 * @param {string} email
 */
export async function getUserScans(email) {
  const { data } = await api.get(`/scans/${encodeURIComponent(email)}`)
  return data.scans || []
}

/**
 * Delete a scan by id.
 * @param {string} scanId
 */
export async function deleteScan(scanId) {
  const { data } = await api.delete(`/scans/${scanId}/delete`)
  return data
}

export default api
