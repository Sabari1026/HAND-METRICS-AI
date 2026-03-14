"""
app.py – HandMetrics AI Flask Backend
Routes:
  POST /analyze          Upload a video file → process → save to Supabase → return JSON
  POST /analyze-frame    Send a base64 JPEG frame (live scan) → return JSON immediately
  GET  /scans/<email>    Return all saved scans for a user
"""

import os
import base64
import json
import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from video_processor import process_video, process_single_frame

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Only import supabase if credentials are present
supabase_client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[INFO] Supabase client initialised.")
    except Exception as e:
        print(f"[WARN] Supabase init failed: {e}")
else:
    print("[WARN] Supabase credentials not set – DB/Storage writes disabled.")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _save_to_supabase(measurements: dict, user_email: str, video_url: str = ""):
    """Insert a hand_scans row. Returns the inserted row or None."""
    if supabase_client is None:
        return None

    row = {
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "scan_date": datetime.now(timezone.utc).isoformat(),
        "thumb_length":  measurements.get("thumb_length"),
        "index_length":  measurements.get("index_length"),
        "middle_length": measurements.get("middle_length"),
        "ring_length":   measurements.get("ring_length"),
        "pinky_length":  measurements.get("pinky_length"),
        "palm_width":    measurements.get("palm_width"),
        "palm_height":   measurements.get("palm_height"),
        "hand_orientation": measurements.get("hand_orientation", "Unknown"),
        "finger_angles": json.dumps(measurements.get("finger_angles", {})),
        "video_url": video_url,
    }

    try:
        res = supabase_client.table("hand_scans").insert(row).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"[ERROR] Supabase insert failed: {e}")
        return None


def _upload_video_to_storage(file_bytes: bytes, filename: str) -> str:
    """Upload video bytes to Supabase Storage bucket 'hand-videos'. Returns public URL."""
    if supabase_client is None:
        return ""

    bucket = "hand-videos"
    path = f"{uuid.uuid4()}_{filename}"
    try:
        supabase_client.storage.from_(bucket).upload(
            path,
            file_bytes,
            {"content-type": "video/mp4"},
        )
        url = supabase_client.storage.from_(bucket).get_public_url(path)
        return url
    except Exception as e:
        print(f"[ERROR] Storage upload failed: {e}")
        return ""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "HandMetrics AI"})


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts:
      video      : file upload (mp4 / avi / mov …)
      user_email : form field (string)

    Returns JSON with measurements + saved scan id (if Supabase is configured).
    """
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files["video"]
    user_email = request.form.get("user_email", "anonymous@example.com")

    # Process video
    result = process_video(video_file)
    if result is None:
        return jsonify({"error": "No hand detected in this video"}), 422

    # Upload video to storage first (need bytes – reload the file)
    video_file.stream.seek(0)
    video_bytes = video_file.stream.read()
    video_url = _upload_video_to_storage(video_bytes, video_file.filename)

    # Persist to database
    saved = _save_to_supabase(result, user_email, video_url)
    scan_id = saved["id"] if saved else None

    return jsonify({
        "success": True,
        "scan_id": scan_id,
        "video_url": video_url,
        "measurements": result,
    })


@app.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    """
    Accepts JSON: { "frame": "<base64-encoded JPEG string>" }
    Returns measurements dict for a single frame (no DB write).
    """
    data = request.get_json(force=True)
    if not data or "frame" not in data:
        return jsonify({"error": "No frame data provided"}), 400

    try:
        img_bytes = base64.b64decode(data["frame"].split(",")[-1])  # strip data URI prefix
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"Invalid frame data: {str(e)}"}), 400

    result = process_single_frame(frame)
    if result is None:
        return jsonify({"detected": False})

    return jsonify({"detected": True, "measurements": result})


@app.route("/scans/<string:user_email>", methods=["GET"])
def get_scans(user_email):
    """Return all scans for a given user email."""
    if supabase_client is None:
        return jsonify({"error": "Database not configured"}), 503

    try:
        res = (
            supabase_client.table("hand_scans")
            .select("*")
            .eq("user_email", user_email)
            .order("scan_date", desc=True)
            .execute()
        )
        return jsonify({"scans": res.data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/scans/<string:scan_id>/delete", methods=["DELETE"])
def delete_scan(scan_id):
    """Delete a scan by ID."""
    if supabase_client is None:
        return jsonify({"error": "Database not configured"}), 503

    try:
        supabase_client.table("hand_scans").delete().eq("id", scan_id).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
