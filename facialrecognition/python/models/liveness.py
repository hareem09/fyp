# models/liveness.py — OpenCV only, no mediapipe needed
import cv2
import numpy as np
from scipy.spatial import distance

class LivenessDetector:
    def __init__(self):
        print("Loading OpenCV liveness detector...")

        # Load eye detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )

        # EAR threshold — below this = eye closed
        self.EAR_THRESHOLD  = 0.25
        self.BLINK_REQUIRED = 1

        print("✅ OpenCV liveness detector ready")

    # ── DETECT EYES AND CALCULATE EAR ─────────────────────────
    def get_ear_from_eyes(self, eye_region):
        """
        Calculate a simple Eye Aspect Ratio from eye bounding box
        When eye is open  → region is wider than tall
        When eye is closed → region becomes shorter
        """
        if eye_region is None:
            return 0.3  # default open eye value

        h, w = eye_region.shape[:2]

        if w == 0:
            return 0.3

        # Simple ratio: height/width
        # Open eye: small ratio
        # Closed eye: larger ratio (eye becomes more square)
        ratio = h / w
        return ratio

    # ── ANALYZE SINGLE FRAME ──────────────────────────────────
    def analyze_frame(self, image):
        """
        Analyze single frame for eye state
        Returns dict with detection results
        """
        if image is None:
            return {
                'face_detected': False,
                'eyes_detected': 0,
                'ear': 0.3,
                'is_blink': False
            }

        gray  = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect face first
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        if len(faces) == 0:
            return {
                'face_detected': False,
                'eyes_detected': 0,
                'ear': 0.3,
                'is_blink': False
            }

        # Use largest face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

        # Focus on upper half of face for eyes
        face_roi  = gray[y:y + h//2, x:x + w]

        # Detect eyes inside face region
        eyes = self.eye_cascade.detectMultiScale(
            face_roi,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(20, 20)
        )

        eyes_count = len(eyes)

        # If no eyes detected = possible blink
        is_blink = eyes_count == 0

        return {
            'face_detected': True,
            'eyes_detected': eyes_count,
            'ear':           0.1 if is_blink else 0.3,
            'is_blink':      is_blink
        }

    # ── MAIN LIVENESS CHECK ───────────────────────────────────
    def check_liveness(self, frames):
        """
        Check liveness from sequence of frames
        Detects blink by tracking when eyes disappear and reappear
        """
        if not frames or len(frames) < 5:
            return {
                'is_live':     False,
                'reason':      'Not enough frames. Minimum 5 required.',
                'blink_count': 0
            }

        blink_count    = 0
        eye_was_closed = False
        eyes_history   = []
        faces_detected = 0

        print(f"Analyzing {len(frames)} frames for liveness...")

        for i, frame in enumerate(frames):
            result = self.analyze_frame(frame)

            if not result['face_detected']:
                continue

            faces_detected += 1
            eyes_count = result['eyes_detected']
            eyes_history.append(eyes_count)

            print(f"  Frame {i+1}: face=✅ eyes={eyes_count}")

            # Blink detection
            # Eyes close → eyes_count drops to 0
            if result['is_blink'] and not eye_was_closed:
                eye_was_closed = True
                print(f"  Frame {i+1}: Eyes closing...")

            # Eyes open again → blink complete
            elif not result['is_blink'] and eye_was_closed:
                eye_was_closed = False
                blink_count += 1
                print(f"  Frame {i+1}: ✅ Blink #{blink_count} detected!")

        # No face detected at all
        if faces_detected == 0:
            return {
                'is_live':     False,
                'reason':      'No face detected. Please look at the camera.',
                'blink_count': 0
            }

        # Check eye count variance
        # Static photo = eye count never changes
        eye_variance = float(np.var(eyes_history)) if len(eyes_history) > 1 else 0
        print(f"Eye count variance: {eye_variance}")

        if eye_variance == 0 and blink_count == 0 and faces_detected > 3:
            return {
                'is_live':     False,
                'reason':      'Possible photo spoof. No eye movement detected.',
                'blink_count': 0
            }

        # Check required blinks
        if blink_count >= self.BLINK_REQUIRED:
            return {
                'is_live':     True,
                'reason':      f'Liveness confirmed. {blink_count} blink(s) detected.',
                'blink_count': blink_count
            }

        return {
            'is_live':     False,
            'reason':      'No blink detected. Please blink naturally.',
            'blink_count': blink_count
        }