"""
hand_detector.py
MediaPipe Hands wrapper – detect 21 landmarks from a single BGR frame.
"""

import cv2
import mediapipe as mp

mp_hands = mp.solutions.hands

# Re-use a single Hands instance across calls for performance
_hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.65,
    min_tracking_confidence=0.65,
)


def detect_hand(frame):
    """
    Parameters
    ----------
    frame : np.ndarray  BGR image (H x W x 3)

    Returns
    -------
    list of (x, y) tuples (21 items, normalised coords) or None if no hand found.
    """
    if frame is None:
        return None

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb.flags.writeable = False
    results = _hands.process(rgb)
    rgb.flags.writeable = True

    if results.multi_hand_landmarks:
        landmarks = [
            (lm.x, lm.y)
            for lm in results.multi_hand_landmarks[0].landmark
        ]
        return landmarks

    return None


def detect_hand_with_info(frame):
    """
    Like detect_hand but also returns handedness ('Left' / 'Right').

    Returns
    -------
    (landmarks, handedness_str) or (None, None)
    """
    if frame is None:
        return None, None

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb.flags.writeable = False
    results = _hands.process(rgb)
    rgb.flags.writeable = True

    if results.multi_hand_landmarks and results.multi_handedness:
        landmarks = [
            (lm.x, lm.y)
            for lm in results.multi_hand_landmarks[0].landmark
        ]
        hand_label = results.multi_handedness[0].classification[0].label
        # MediaPipe mirrors the image so Left/Right are swapped in front camera
        orientation = "Left" if hand_label == "Right" else "Right"
        return landmarks, orientation

    return None, None
