"""
measurements.py
Pure-numpy geometry utilities for computing hand measurements
from 21 normalised MediaPipe landmark coordinates.
"""

import numpy as np


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _pt(landmarks, idx):
    """Return landmark[idx] as a numpy array."""
    return np.array(landmarks[idx])


def distance(p1, p2):
    """Euclidean distance between two (x, y) points."""
    p1, p2 = np.array(p1), np.array(p2)
    return float(np.linalg.norm(p1 - p2))


def angle_between(a, b, c):
    """
    Angle (degrees) at vertex B formed by the rays B→A and B→C.
    a, b, c are (x, y) tuples / arrays.
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-9)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    return float(np.degrees(np.arccos(cos_angle)))


# ---------------------------------------------------------------------------
# MediaPipe Hand Landmark Reference (21 points)
# ---------------------------------------------------------------------------
#   0  Wrist
#   1  Thumb CMC   2  Thumb MCP   3  Thumb IP    4  Thumb Tip
#   5  Index MCP   6  Index PIP   7  Index DIP   8  Index Tip
#   9  Middle MCP 10  Middle PIP 11  Middle DIP 12  Middle Tip
#  13  Ring MCP   14  Ring PIP   15  Ring DIP   16  Ring Tip
#  17  Pinky MCP  18  Pinky PIP  19  Pinky DIP  20  Pinky Tip
# ---------------------------------------------------------------------------


def calculate_measurements(landmarks):
    """
    Compute all hand measurements from 21 landmark (x, y) normalised tuples.

    Returns a dict with float values (normalised units) and a JSON-serialisable
    finger_angles sub-dict.
    """
    if landmarks is None or len(landmarks) < 21:
        return None

    # ----- Finger lengths (base MCP → tip) --------------------------------
    thumb_length  = distance(landmarks[2],  landmarks[4])
    index_length  = distance(landmarks[5],  landmarks[8])
    middle_length = distance(landmarks[9],  landmarks[12])
    ring_length   = distance(landmarks[13], landmarks[16])
    pinky_length  = distance(landmarks[17], landmarks[20])

    # ----- Palm dimensions ------------------------------------------------
    palm_width  = distance(landmarks[5], landmarks[17])
    palm_height = distance(landmarks[0], landmarks[9])

    # ----- Finger angles (angle at PIP joint) -----------------------------
    thumb_angle  = angle_between(landmarks[1],  landmarks[2],  landmarks[3])
    index_angle  = angle_between(landmarks[5],  landmarks[6],  landmarks[7])
    middle_angle = angle_between(landmarks[9],  landmarks[10], landmarks[11])
    ring_angle   = angle_between(landmarks[13], landmarks[14], landmarks[15])
    pinky_angle  = angle_between(landmarks[17], landmarks[18], landmarks[19])

    finger_angles = {
        "thumb":  round(thumb_angle,  2),
        "index":  round(index_angle,  2),
        "middle": round(middle_angle, 2),
        "ring":   round(ring_angle,   2),
        "pinky":  round(pinky_angle,  2),
    }

    return {
        "thumb_length":  round(thumb_length,  6),
        "index_length":  round(index_length,  6),
        "middle_length": round(middle_length, 6),
        "ring_length":   round(ring_length,   6),
        "pinky_length":  round(pinky_length,  6),
        "palm_width":    round(palm_width,    6),
        "palm_height":   round(palm_height,   6),
        "finger_angles": finger_angles,
    }


def aggregate_measurements(measurements_list):
    """
    Given a list of measurement dicts (one per sampled frame), return the
    median values to smooth out noise.
    """
    if not measurements_list:
        return None

    keys = [
        "thumb_length", "index_length", "middle_length",
        "ring_length",  "pinky_length", "palm_width", "palm_height"
    ]

    result = {}
    for k in keys:
        values = [m[k] for m in measurements_list if m and k in m]
        result[k] = round(float(np.median(values)), 6) if values else 0.0

    # Median per angle
    angle_keys = ["thumb", "index", "middle", "ring", "pinky"]
    result["finger_angles"] = {}
    for ak in angle_keys:
        vals = [m["finger_angles"][ak] for m in measurements_list
                if m and "finger_angles" in m and ak in m["finger_angles"]]
        result["finger_angles"][ak] = round(float(np.median(vals)), 2) if vals else 0.0

    return result
