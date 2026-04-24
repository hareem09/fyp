# models/liveness.py
import cv2
import numpy as np
import mediapipe as mp
from scipy.spatial import distance

class LivenessDetector:
    def __init__(self):
        print("Loading MediaPipe Face Mesh...")

        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh    = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,      # True for single images
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # 6 landmark points per eye for EAR calculation
        # These are MediaPipe Face Mesh indices
        self.LEFT_EYE_EAR  = [362, 385, 387, 263, 373, 380]
        self.RIGHT_EYE_EAR = [33,  160, 158, 133, 153, 144]

        # EAR below this value = eye is closed
        self.EAR_THRESHOLD  = 0.25
        # Number of blinks required to pass
        self.BLINK_REQUIRED = 1

        print("✅ MediaPipe loaded successfully")

    # ── CALCULATE EYE ASPECT RATIO ─────────────────────────────
    def calculate_ear(self, landmarks, eye_indices, width, height):
        """
        Eye Aspect Ratio formula:
        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

        p1, p4 = horizontal corners of eye
        p2, p3, p5, p6 = vertical landmarks

        Open eye  → EAR ≈ 0.30
        Closed eye → EAR ≈ 0.05
        """
        # Extract 6 eye points as pixel coordinates
        points = []
        for idx in eye_indices:
            lm = landmarks[idx]
            x  = int(lm.x * width)
            y  = int(lm.y * height)
            points.append((x, y))

        # Vertical distances
        v1 = distance.euclidean(points[1], points[5])
        v2 = distance.euclidean(points[2], points[4])

        # Horizontal distance
        h  = distance.euclidean(points[0], points[3])

        # Avoid division by zero
        if h == 0:
            return 0.0

        ear = (v1 + v2) / (2.0 * h)
        return round(ear, 4)

    # ── ANALYZE SINGLE FRAME ───────────────────────────────────
    def analyze_frame(self, image):
        """
        Analyze a single frame for face and EAR values
        Returns dict with detection results
        """
        if image is None:
            return {
                'face_detected': False,
                'left_ear': 0,
                'right_ear': 0,
                'avg_ear': 0,
                'is_blink': False
            }

        h, w = image.shape[:2]

        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Process frame
        results = self.face_mesh.process(image_rgb)

        if not results.multi_face_landmarks:
            return {
                'face_detected': False,
                'left_ear': 0,
                'right_ear': 0,
                'avg_ear': 0,
                'is_blink': False
            }

        landmarks = results.multi_face_landmarks[0].landmark

        # Calculate EAR for both eyes
        left_ear  = self.calculate_ear(landmarks, self.LEFT_EYE_EAR,  w, h)
        right_ear = self.calculate_ear(landmarks, self.RIGHT_EYE_EAR, w, h)
        avg_ear   = round((left_ear + right_ear) / 2.0, 4)

        return {
            'face_detected': True,
            'left_ear':  left_ear,
            'right_ear': right_ear,
            'avg_ear':   avg_ear,
            'is_blink':  avg_ear < self.EAR_THRESHOLD
        }

    # ── MAIN LIVENESS CHECK ────────────────────────────────────
    def check_liveness(self, frames):
        """
        Check liveness across a sequence of frames
        
        Logic:
        ┌─────────────────────────────────────────────┐
        │ Real person: EAR varies, blinks detected     │
        │ Photo spoof: EAR constant, no blinks         │
        │ Video spoof: EAR varies but pattern differs  │
        └─────────────────────────────────────────────┘
        
        Returns dict with is_live and reason
        """
        if not frames or len(frames) < 5:
            return {
                'is_live':    False,
                'reason':     'Not enough frames. Minimum 5 required.',
                'blink_count': 0
            }

        blink_count    = 0
        eye_was_closed = False
        ear_history    = []
        faces_detected = 0

        print(f"Analyzing {len(frames)} frames for liveness...")

        for i, frame in enumerate(frames):
            result = self.analyze_frame(frame)

            if not result['face_detected']:
                continue

            faces_detected += 1
            ear = result['avg_ear']
            ear_history.append(ear)

            # Blink detection state machine
            # Eye closes (EAR drops below threshold)
            if result['is_blink'] and not eye_was_closed:
                eye_was_closed = True
                print(f"  Frame {i+1}: Eye closing (EAR={ear})")

            # Eye opens again (EAR rises above threshold)
            elif not result['is_blink'] and eye_was_closed:
                eye_was_closed = False
                blink_count += 1
                print(f"  Frame {i+1}: ✅ Blink #{blink_count} detected (EAR={ear})")

        # ── CHECKS ────────────────────────────────────────────
        # No face detected at all
        if faces_detected == 0:
            return {
                'is_live':     False,
                'reason':      'No face detected. Please look at the camera.',
                'blink_count': 0
            }

        # Too few frames with face
        if faces_detected < 3:
            return {
                'is_live':     False,
                'reason':      'Face not consistently visible. Please hold still.',
                'blink_count': blink_count
            }

        # Check EAR variance — static photo has near-zero variance
        ear_variance = float(np.var(ear_history)) if len(ear_history) > 1 else 0
        print(f"EAR variance: {ear_variance:.6f}")

        if ear_variance < 0.00005 and blink_count == 0:
            return {
                'is_live':      False,
                'reason':       'Spoofing detected. Static image or video detected.',
                'blink_count':  0,
                'ear_variance': ear_variance
            }

        # Check required blinks
        if blink_count >= self.BLINK_REQUIRED:
            return {
                'is_live':      True,
                'reason':       f'Liveness confirmed. {blink_count} blink(s) detected.',
                'blink_count':  blink_count,
                'ear_variance': ear_variance
            }

        # Not enough blinks
        return {
            'is_live':      False,
            'reason':       'No blink detected. Please blink naturally and try again.',
            'blink_count':  blink_count,
            'ear_variance': ear_variance
        }