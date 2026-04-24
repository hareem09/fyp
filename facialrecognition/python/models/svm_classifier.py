# models/svm_classifier.py
import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder, Normalizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

EMBEDDINGS_DIR = 'data/embeddings'
MODEL_PATH     = 'trained_model/svm_model.pkl'
ENCODER_PATH   = 'trained_model/label_encoder.pkl'

class SVMClassifier:
    def __init__(self):
        self.model         = None
        self.label_encoder = LabelEncoder()
        self.is_trained    = False

        # Create required directories
        os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
        os.makedirs('trained_model', exist_ok=True)

        # Load existing trained model if available
        self._load_model()

    # ── SAVE FACE EMBEDDING TO DISK ────────────────────────────
    def save_embedding(self, user_id, embedding):
        """
        Save a user's face embedding as .npy file
        Filename = userId.npy
        """
        filepath = os.path.join(EMBEDDINGS_DIR, f'{user_id}.npy')
        np.save(filepath, embedding)
        print(f"✅ Embedding saved: {filepath}")

    # ── CHECK IF USER HAS EMBEDDING ────────────────────────────
    def has_embedding(self, user_id):
        filepath = os.path.join(EMBEDDINGS_DIR, f'{user_id}.npy')
        return os.path.exists(filepath)

    # ── LOAD ALL EMBEDDINGS FROM DISK ──────────────────────────
    def load_all_embeddings(self):
        """
        Load all stored embeddings and their user ID labels
        Returns (X, y) where X = embeddings array, y = user IDs array
        """
        X = []  # embeddings
        y = []  # labels

        if not os.path.exists(EMBEDDINGS_DIR):
            return None, None

        files = [f for f in os.listdir(EMBEDDINGS_DIR) if f.endswith('.npy')]

        if len(files) == 0:
            return None, None

        for filename in files:
            user_id  = filename.replace('.npy', '')
            filepath = os.path.join(EMBEDDINGS_DIR, filename)

            try:
                embedding = np.load(filepath)
                X.append(embedding)
                y.append(user_id)
            except Exception as e:
                print(f"Error loading {filename}: {e}")
                continue

        if len(X) == 0:
            return None, None

        return np.array(X), np.array(y)

    # ── TRAIN SVM MODEL ────────────────────────────────────────
    def train(self):
        """
        Train SVM on all stored embeddings
        Called after each new enrollment
        Returns True on success, False on failure
        """
        X, y = self.load_all_embeddings()

        if X is None:
            print("❌ No embeddings found. Cannot train.")
            return False

        unique_users = len(set(y))
        print(f"Training SVM: {len(X)} samples, {unique_users} users")

        if unique_users < 2:
            print("❌ Need at least 2 enrolled users to train SVM")
            # Store the single user for later
            return False

        # Encode string user IDs → integers
        y_encoded = self.label_encoder.fit_transform(y)

        # Build pipeline: L2 normalize → SVM with RBF kernel
        self.model = Pipeline([
            ('normalizer', Normalizer(norm='l2')),
            ('svm', SVC(
                kernel='rbf',
                C=10.0,
                gamma='scale',
                probability=True,       # needed for confidence scores
                class_weight='balanced' # handles unequal samples per user
            ))
        ])

        # Train the model
        self.model.fit(X, y_encoded)
        self.is_trained = True

        # Save model and label encoder to disk
        joblib.dump(self.model,         MODEL_PATH)
        joblib.dump(self.label_encoder, ENCODER_PATH)

        print(f"✅ SVM trained and saved successfully")
        print(f"   Users enrolled: {unique_users}")
        print(f"   Total samples:  {len(X)}")

        return True

    # ── PREDICT USER FROM EMBEDDING ────────────────────────────
    def predict(self, embedding, threshold=0.85):
        """
        Predict user ID from embedding
        Returns (user_id, confidence) or (None, confidence) if below threshold
        """
        if not self.is_trained or self.model is None:
            print("❌ Model not trained yet")
            return None, 0.0

        # Reshape single sample for sklearn
        embedding_array = np.array(embedding).reshape(1, -1)

        # Get probability for each class
        probabilities = self.model.predict_proba(embedding_array)[0]

        # Highest confidence class
        max_confidence   = float(np.max(probabilities))
        predicted_index  = int(np.argmax(probabilities))

        print(f"Recognition confidence: {max_confidence:.3f}")

        # Reject if below threshold
        if max_confidence < threshold:
            print(f"❌ Confidence {max_confidence:.3f} below threshold {threshold}")
            return None, max_confidence

        # Decode integer label back to user ID string
        predicted_user_id = self.label_encoder.inverse_transform([predicted_index])[0]

        print(f"✅ Recognized: {predicted_user_id} ({max_confidence:.3f})")
        return predicted_user_id, max_confidence

    # ── DELETE USER EMBEDDING ──────────────────────────────────
    def delete_embedding(self, user_id):
        """
        Remove a user's embedding file
        Called when user account is deleted
        Retrains model after deletion
        """
        filepath = os.path.join(EMBEDDINGS_DIR, f'{user_id}.npy')

        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"✅ Embedding deleted for user: {user_id}")
            # Retrain without deleted user
            self.train()
            return True

        print(f"No embedding found for user: {user_id}")
        return False

    # ── GET ALL ENROLLED USERS ─────────────────────────────────
    def get_enrolled_users(self):
        """Return list of all enrolled user IDs"""
        if not os.path.exists(EMBEDDINGS_DIR):
            return []

        files = os.listdir(EMBEDDINGS_DIR)
        return [f.replace('.npy', '') for f in files if f.endswith('.npy')]

    # ── LOAD SAVED MODEL FROM DISK ─────────────────────────────
    def _load_model(self):
        """Load previously trained model on startup"""
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            try:
                self.model         = joblib.load(MODEL_PATH)
                self.label_encoder = joblib.load(ENCODER_PATH)
                self.is_trained    = True
                print("✅ Existing SVM model loaded")
            except Exception as e:
                print(f"❌ Failed to load model: {e}")
        else:
            print("ℹ️  No existing model found. Will train after enrollment.")