# models/facenet.py
import numpy as np
import cv2
from keras_facenet import FaceNet

class FaceNetEmbedder:
    def __init__(self):
        print("Loading FaceNet model...")
        self.embedder = FaceNet()

        # Load OpenCV face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

        print("✅ FaceNet model loaded successfully")

    # ── DETECT FACE IN IMAGE ───────────────────────────────────
    def detect_face(self, image):
        """
        Detect largest face in image using OpenCV
        Returns cropped face resized to 160x160 (FaceNet input size)
        Returns None if no face found
        """
        if image is None:
            return None

        # Convert to grayscale for detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        if len(faces) == 0:
            return None

        # Pick the largest face if multiple detected
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        x, y, w, h = largest_face

        # Add padding around the face
        padding = 20
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(image.shape[1], x + w + padding)
        y2 = min(image.shape[0], y + h + padding)

        # Crop face region
        face_crop = image[y1:y2, x1:x2]

        # Resize to 160x160 (required by FaceNet)
        face_resized = cv2.resize(face_crop, (160, 160))

        return face_resized

    # ── GENERATE SINGLE EMBEDDING ──────────────────────────────
    def get_embedding(self, image):
        """
        Generate 128-dimensional face embedding from image
        Returns numpy array of 128 floats or None if no face found
        """
        if image is None:
            return None

        # Detect and crop face
        face = self.detect_face(image)

        if face is None:
            print("No face detected in image")
            return None

        # Convert BGR to RGB (FaceNet expects RGB)
        face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)

        # Add batch dimension: (160, 160, 3) → (1, 160, 160, 3)
        face_array = np.expand_dims(face_rgb, axis=0)

        # Generate embedding — returns shape (1, 128)
        embedding = self.embedder.embeddings(face_array)

        # Return 1D array of 128 floats
        return embedding[0]

    # ── GENERATE AVERAGE EMBEDDING FROM MULTIPLE IMAGES ───────
    def get_average_embedding(self, images):
        """
        Generate averaged embedding from multiple face images
        Used during enrollment for better accuracy
        More images = more robust embedding
        """
        embeddings = []

        for i, image in enumerate(images):
            embedding = self.get_embedding(image)

            if embedding is not None:
                embeddings.append(embedding)
                print(f"  Image {i+1}: ✅ face detected")
            else:
                print(f"  Image {i+1}: ❌ no face detected, skipping")

        if len(embeddings) == 0:
            print("No valid faces found in any image")
            return None

        print(f"Generating average from {len(embeddings)} valid embeddings")

        # Average all valid embeddings
        average = np.mean(embeddings, axis=0)

        # L2 normalize the final embedding
        norm = np.linalg.norm(average)
        if norm > 0:
            average = average / norm

        return average

    # ── GET EMBEDDING WITH AUGMENTATION ───────────────────────
    def get_embedding_with_augmentation(self, image):
        """
        Generate embedding using original + slightly modified versions
        Improves robustness of stored embedding
        """
        from utils.image_utils import flip_image, adjust_brightness

        images = [
            image,
            flip_image(image),
            adjust_brightness(image, 1.1),
            adjust_brightness(image, 0.9)
        ]

        return self.get_average_embedding(images)