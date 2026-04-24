# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

# Import all modules
from models.facenet        import FaceNetEmbedder
from models.svm_classifier import SVMClassifier
from models.liveness       import LivenessDetector
from models.geofence       import GeofenceValidator
from utils.image_utils     import (
    base64_to_image,
    preprocess_image,
    validate_image
)

app = Flask(__name__)
CORS(app)  # Allow requests from Node.js backend
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
# ── INITIALIZE ALL MODELS ON STARTUP ──────────────────────────
print("\n" + "="*50)
print("  Smart Attendance AI Service Starting...")
print("="*50)

facenet_embedder = FaceNetEmbedder()
svm_classifier   = SVMClassifier()
liveness_detector = LivenessDetector()
geofence_validator = GeofenceValidator()

print("="*50)
print("  All models loaded. Server starting...")
print("="*50 + "\n")


# ══════════════════════════════════════════════════════════════
# ROUTE 1 — HEALTH CHECK
# ══════════════════════════════════════════════════════════════
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':        'running',
        'model_trained': svm_classifier.is_trained,
        'enrolled_users': svm_classifier.get_enrolled_users(),
        'message':       'AI service is healthy'
    })


# ══════════════════════════════════════════════════════════════
# ROUTE 2 — ENROLL FACE
# POST /enroll
# Body: { userId, images: [base64, base64, ...] }
# ══════════════════════════════════════════════════════════════
@app.route('/enroll', methods=['POST'])
def enroll():
    try:
        data    = request.get_json()
        user_id = data.get('userId')
        images  = data.get('images', [])

        print(f"\n--- ENROLL REQUEST ---")
        print(f"User ID:      {user_id}")
        print(f"Images count: {len(images)}")

        # Validate input
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'userId is required'
            }), 400

        if len(images) < 5:
            return jsonify({
                'success': False,
                'message': f'Minimum 5 images required. Got {len(images)}'
            }), 400

        # Decode and validate each image
        decoded_images = []
        for i, img_b64 in enumerate(images):
            if not validate_image(img_b64):
                print(f"  Image {i+1}: invalid, skipping")
                continue

            img = base64_to_image(img_b64)
            if img is None:
                continue

            img = preprocess_image(img)
            decoded_images.append(img)

        print(f"Valid images: {len(decoded_images)} / {len(images)}")

        if len(decoded_images) < 3:
            return jsonify({
                'success': False,
                'message': 'Not enough valid face images. '
                           'Please ensure good lighting and face the camera.'
            }), 400

        # Generate averaged embedding from all valid images
        print("Generating face embeddings...")
        embedding = facenet_embedder.get_average_embedding(decoded_images)

        if embedding is None:
            return jsonify({
                'success': False,
                'message': 'No face detected in images. '
                           'Please ensure your face is clearly visible.'
            }), 400

        # Save embedding to disk
        svm_classifier.save_embedding(user_id, embedding)

        # Retrain SVM with new user included
        trained = svm_classifier.train()

        return jsonify({
            'success':       True,
            'message':       'Face enrolled successfully',
            'embedding':     embedding.tolist(),  # send to Node.js for MongoDB storage
            'model_trained': trained,
            'total_enrolled': len(svm_classifier.get_enrolled_users())
        })

    except Exception as e:
        print(f"❌ Enroll error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════════
# ROUTE 3 — RECOGNIZE FACE
# POST /recognize
# Body: { image: base64 }
# ══════════════════════════════════════════════════════════════
@app.route('/recognize', methods=['POST'])
def recognize():
    try:
        data      = request.get_json()
        image_b64 = data.get('image')

        print(f"\n--- RECOGNIZE REQUEST ---")

        if not image_b64:
            return jsonify({
                'success': False,
                'message': 'image is required'
            }), 400

        if not svm_classifier.is_trained:
            return jsonify({
                'success': False,
                'message': 'No model trained yet. Enroll users first.'
            }), 400

        # Decode image
        image = base64_to_image(image_b64)
        if image is None:
            return jsonify({
                'success': False,
                'message': 'Invalid image data'
            }), 400

        # Preprocess
        image = preprocess_image(image)

        # Generate embedding
        print("Generating embedding for recognition...")
        embedding = facenet_embedder.get_embedding(image)

        if embedding is None:
            return jsonify({
                'success': False,
                'message': 'No face detected. Please look directly at the camera.'
            }), 400

        # Predict using SVM
        user_id, confidence = svm_classifier.predict(
            embedding,
            threshold=float(os.getenv('CONFIDENCE_THRESHOLD', 0.85))
        )

        if user_id is None:
            return jsonify({
                'success':    False,
                'message':    f'Face not recognized. '
                              f'Confidence {confidence:.0%} is too low.',
                'confidence': confidence
            }), 401

        return jsonify({
            'success':    True,
            'userId':     user_id,
            'confidence': confidence,
            'message':    'Face recognized successfully'
        })

    except Exception as e:
        print(f"❌ Recognize error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════════
# ROUTE 4 — LIVENESS DETECTION
# POST /liveness
# Body: { frames: [base64, base64, ...] }
# ══════════════════════════════════════════════════════════════
@app.route('/liveness', methods=['POST'])
def check_liveness():
    try:
        data   = request.get_json()
        frames = data.get('frames', [])

        print(f"\n--- LIVENESS REQUEST ---")
        print(f"Frames received: {len(frames)}")

        if len(frames) < 5:
            return jsonify({
                'success':     False,
                'is_live':     False,
                'message':     'Minimum 5 frames required',
                'blink_count': 0
            }), 400

        # Decode all frames
        decoded_frames = []
        for i, frame_b64 in enumerate(frames):
            frame = base64_to_image(frame_b64)
            if frame is not None:
                decoded_frames.append(frame)

        print(f"Valid frames: {len(decoded_frames)}")

        # Run liveness check
        result = liveness_detector.check_liveness(decoded_frames)

        print(f"Liveness result: {'✅ LIVE' if result['is_live'] else '❌ SPOOF'}")
        print(f"Reason: {result['reason']}")

        return jsonify({
            'success':     result['is_live'],
            'is_live':     result['is_live'],
            'reason':      result['reason'],
            'blink_count': result['blink_count'],
            'message':     result['reason']
        })

    except Exception as e:
        print(f"❌ Liveness error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════════
# ROUTE 5 — GEOFENCE VALIDATION
# POST /geofence
# Body: { userLat, userLng, geofences: [...] }
# ══════════════════════════════════════════════════════════════
@app.route('/geofence', methods=['POST'])
def validate_geofence():
    try:
        data      = request.get_json()
        user_lat  = data.get('userLat')
        user_lng  = data.get('userLng')
        geofences = data.get('geofences', [])

        print(f"\n--- GEOFENCE REQUEST ---")
        print(f"User location: ({user_lat}, {user_lng})")
        print(f"Geofences to check: {len(geofences)}")

        if user_lat is None or user_lng is None:
            return jsonify({
                'success': False,
                'valid':   False,
                'message': 'userLat and userLng are required'
            }), 400

        result = geofence_validator.validate_location(
            float(user_lat),
            float(user_lng),
            geofences
        )

        print(f"Geofence result: {'✅ VALID' if result['valid'] else '❌ INVALID'}")

        return jsonify({
            'success':       result['valid'],
            'valid':         result['valid'],
            'reason':        result['reason'],
            'nearest_fence': result.get('nearest_fence'),
            'message':       result['reason']
        })

    except Exception as e:
        print(f"❌ Geofence error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════════
# ROUTE 6 — DELETE USER EMBEDDING
# DELETE /enroll/<user_id>
# ══════════════════════════════════════════════════════════════
@app.route('/enroll/<user_id>', methods=['DELETE'])
def delete_enrollment(user_id):
    try:
        print(f"\n--- DELETE ENROLLMENT: {user_id} ---")

        success = svm_classifier.delete_embedding(user_id)

        if success:
            return jsonify({
                'success': True,
                'message': f'Enrollment deleted for user {user_id}'
            })

        return jsonify({
            'success': False,
            'message': 'No enrollment found for this user'
        }), 404

    except Exception as e:
        print(f"❌ Delete error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════════
# ROUTE 7 — RETRAIN MODEL MANUALLY
# POST /retrain
# ══════════════════════════════════════════════════════════════
@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        print("\n--- MANUAL RETRAIN ---")
        success = svm_classifier.train()

        if success:
            return jsonify({
                'success':        True,
                'message':        'Model retrained successfully',
                'enrolled_users': svm_classifier.get_enrolled_users()
            })

        return jsonify({
            'success': False,
            'message': 'Retraining failed. Need at least 2 enrolled users.'
        }), 400

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ══════════════════════════════════════════════════════════════
# START SERVER
# ══════════════════════════════════════════════════════════════
if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False   # set True during development only
    )