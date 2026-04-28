# models/facenet.py
import numpy as np
from keras_facenet import FaceNet

class FaceNetEmbedder:
    def __init__(self):
        print("Loading FaceNet + MTCNN...")
        self.embedder = FaceNet()
        print("✅ FaceNet + MTCNN ready")

    # ── GENERATE SINGLE EMBEDDING ──────────────────────────────
    def get_embedding(self, image):
        """
        Uses MTCNN for detection + FaceNet for embedding
        Returns 512-d embedding
        """
        if image is None:
            return None

        faces = self.embedder.extract(image)

        if len(faces) == 0:
            print("❌ No face detected")
            return None

        # Take first detected face
        embedding = faces[0]['embedding']

        # Ensure 1D vector (VERY IMPORTANT)
        embedding = embedding.flatten()

        # Validate shape
        if embedding.shape != (512,):
            print(f"❌ Invalid embedding shape: {embedding.shape}")
            return None

        print(f"✅ Embedding shape: {embedding.shape}")
        return embedding

    # ── AVERAGE EMBEDDING ──────────────────────────────────────
    def get_average_embedding(self, images):
        embeddings = []

        for i, image in enumerate(images):
            emb = self.get_embedding(image)

            if emb is not None:
                embeddings.append(emb)
                print(f"Image {i+1}: ✅")
            else:
                print(f"Image {i+1}: ❌")

        if len(embeddings) == 0:
            print("❌ No valid embeddings found")
            return None

        # Convert safely to numpy array
        embeddings = np.array(embeddings)

        # Compute mean
        avg = np.mean(embeddings, axis=0)

        # Normalize (L2)
        norm = np.linalg.norm(avg)
        if norm > 0:
            avg = avg / norm

        print("✅ Average embedding generated")
        return avg

    # ── AUGMENTATION ───────────────────────────────────────────
    def get_embedding_with_augmentation(self, image):
        from utils.image_utils import flip_image, adjust_brightness

        images = [
            image,
            flip_image(image),
            adjust_brightness(image, 1.1),
            adjust_brightness(image, 0.9)
        ]

        return self.get_average_embedding(images)