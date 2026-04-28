# models/svm_classifier.py
import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder

EMBEDDINGS_DIR = 'data/embeddings'
MODEL_PATH     = 'trained_model/svm_model.pkl'
ENCODER_PATH   = 'trained_model/label_encoder.pkl'


class SVMClassifier:
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.is_trained = False

        os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
        os.makedirs('trained_model', exist_ok=True)

        self._load_model()

    # ── SAVE EMBEDDING ───────────────────────────────
    def save_embedding(self, user_id, embedding):
        embedding = np.array(embedding).flatten()

        if embedding.shape[0] != 512:
            print(f"❌ Invalid embedding size: {embedding.shape}")
            return

        embedding = embedding / np.linalg.norm(embedding)

        user_dir = os.path.join(EMBEDDINGS_DIR, user_id)
        os.makedirs(user_dir, exist_ok=True)

        existing_files = [f for f in os.listdir(user_dir) if f.endswith('.npy')]
        file_index = len(existing_files) + 1

        filepath = os.path.join(user_dir, f"{file_index}.npy")

        np.save(filepath, embedding)

        print(f"✅ Saved embedding: {filepath}")

    # ── LOAD EMBEDDINGS ──────────────────────────────
    def load_all_embeddings(self):
        X, y = [], []

        if not os.path.exists(EMBEDDINGS_DIR):
            return None, None

        for user_id in os.listdir(EMBEDDINGS_DIR):
            user_path = os.path.join(EMBEDDINGS_DIR, user_id)

            if not os.path.isdir(user_path):
                continue

            for file in os.listdir(user_path):
                if not file.endswith('.npy'):
                    continue

                path = os.path.join(user_path, file)

                try:
                    emb = np.load(path).flatten()

                    if emb.shape[0] != 512:
                        print(f"❌ Skipping invalid embedding: {file}")
                        continue

                    X.append(emb)
                    y.append(user_id)

                except Exception as e:
                    print(f"Error loading {file}: {e}")

        if len(X) == 0:
            return None, None

        return np.array(X), np.array(y)

    # ── TRAIN MODEL ───────────────────────────────────
    def train(self):
        X, y = self.load_all_embeddings()

        if X is None:
            print("❌ No embeddings found")
            return False

        print(f"Training SVM: {len(X)} samples, {len(set(y))} users")

        if len(set(y)) < 2:
            print("❌ Need at least 2 users")
            return False

        y_encoded = self.label_encoder.fit_transform(y)

        self.model = SVC(
            kernel='rbf',
            C=10.0,
            gamma='scale',
            probability=True,
            class_weight='balanced'
        )

        self.model.fit(X, y_encoded)
        self.is_trained = True

        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.label_encoder, ENCODER_PATH)

        print("✅ SVM trained successfully")
        return True

    # ── PREDICT ───────────────────────────────────────
    def predict(self, embedding, threshold=0.63):
        if not self.is_trained:
            print("❌ Model not trained")
            return None, 0.0

        emb = np.array(embedding).flatten().reshape(1, -1)

        if emb.shape[1] != 512:
            print(f"❌ Invalid embedding shape: {emb.shape}")
            return None, 0.0

        emb = emb / np.linalg.norm(emb)

        probs = self.model.predict_proba(emb)[0]

        confidence = float(np.max(probs))
        index = int(np.argmax(probs))

        print(f"Confidence: {confidence:.3f}")

        if confidence < threshold:
            return None, confidence

        user_id = self.label_encoder.inverse_transform([index])[0]

        print(f"✅ Recognized: {user_id}")
        return user_id, confidence

    # ── LOAD MODEL ────────────────────────────────────
    def _load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.label_encoder = joblib.load(ENCODER_PATH)
            self.is_trained = True
            print("✅ Model loaded")
        else:
            print("ℹ️ No model found, training required")

    # ── DELETE USER ───────────────────────────────────
    def delete_embedding(self, user_id):
        user_dir = os.path.join(EMBEDDINGS_DIR, user_id)

        if os.path.exists(user_dir):
            import shutil
            shutil.rmtree(user_dir)
            print(f"✅ Deleted {user_id}")
            self.train()
            return True

        return False

    # ── GET USERS ─────────────────────────────────────
    def get_enrolled_users(self):
        return [
            d for d in os.listdir(EMBEDDINGS_DIR)
            if os.path.isdir(os.path.join(EMBEDDINGS_DIR, d))
        ]