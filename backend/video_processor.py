"""
video_processor.py
Read a video file with OpenCV, sample every N-th frame,
run hand detection + measurement on each frame, aggregate results.
"""

import cv2
import tempfile
import os

from hand_detector import detect_hand, detect_hand_with_info
from measurements import calculate_measurements, aggregate_measurements


def process_video(file_storage, sample_every=5):
    """
    Parameters
    ----------
    file_storage : werkzeug.datastructures.FileStorage
        The uploaded video file from Flask request.files.
    sample_every : int
        Process every N-th frame (default=5 to balance speed vs accuracy).

    Returns
    -------
    dict with aggregated measurements + hand_orientation, or None on error.
    """

    # Write the uploaded file to a temp file so OpenCV can read it
    suffix = os.path.splitext(file_storage.filename)[-1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file_storage.save(tmp.name)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            return None

        measurements_list = []
        orientations = []
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_every == 0:
                landmarks, orientation = detect_hand_with_info(frame)
                if landmarks:
                    m = calculate_measurements(landmarks)
                    if m:
                        measurements_list.append(m)
                        if orientation:
                            orientations.append(orientation)

            frame_idx += 1

        cap.release()

        if not measurements_list:
            return None

        result = aggregate_measurements(measurements_list)

        # Most frequent orientation wins
        if orientations:
            result["hand_orientation"] = max(set(orientations), key=orientations.count)
        else:
            result["hand_orientation"] = "Unknown"

        return result

    finally:
        os.unlink(tmp_path)


def process_single_frame(frame):
    """
    Parameters
    ----------
    frame : np.ndarray  BGR image

    Returns
    -------
    dict with measurements + hand_orientation, or None if no hand detected.
    """
    landmarks, orientation = detect_hand_with_info(frame)
    if landmarks is None:
        return None

    m = calculate_measurements(landmarks)
    if m:
        m["hand_orientation"] = orientation or "Unknown"

    return m
