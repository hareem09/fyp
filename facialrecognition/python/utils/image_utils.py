# utils/image_utils.py
import cv2
import numpy as np
import base64

# ── BASE64 TO OPENCV IMAGE ─────────────────────────────────────
def base64_to_image(base64_string):
    """
    Convert base64 string to OpenCV image
    Handles strings with or without data:image prefix
    """
    try:
        # Remove data URL prefix if present
        # e.g. "data:image/jpeg;base64,/9j/4AAQ..." → "/9j/4AAQ..."
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)

        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)

        # Decode to OpenCV BGR image
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        return image

    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None


# ── OPENCV IMAGE TO BASE64 ─────────────────────────────────────
def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.jpg', image)
    base64_string = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{base64_string}"


# ── PREPROCESS IMAGE ───────────────────────────────────────────
def preprocess_image(image):
    """
    Preprocess image for better face detection accuracy
    - Resize if too large
    - Enhance contrast using CLAHE
    - Normalize brightness
    """
    if image is None:
        return None

    # Resize if image is too large (max 800px wide)
    max_width = 800
    h, w = image.shape[:2]
    if w > max_width:
        scale = max_width / w
        new_w = max_width
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h))

    # Convert to LAB color space
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # Apply CLAHE to L channel for contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)

    # Merge channels and convert back to BGR
    lab = cv2.merge((l, a, b))
    image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    return image


# ── VALIDATE IMAGE ─────────────────────────────────────────────
def validate_image(base64_string):
    """
    Check if base64 string is a valid image
    Returns True if valid, False if not
    """
    try:
        image = base64_to_image(base64_string)
        if image is None:
            return False

        h, w = image.shape[:2]

        # Minimum size 100x100 pixels
        if h < 100 or w < 100:
            return False

        return True

    except Exception:
        return False


# ── FLIP IMAGE HORIZONTALLY ────────────────────────────────────
def flip_image(image):
    """Flip image horizontally for data augmentation during enrollment"""
    return cv2.flip(image, 1)


# ── ADJUST BRIGHTNESS ─────────────────────────────────────────
def adjust_brightness(image, factor=1.2):
    """Slightly brighten image for better detection in low light"""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * factor, 0, 255)
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)