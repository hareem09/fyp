// frontend/src/pages/EnrollFace.jsx
import { useRef, useState, useEffect } from 'react';
import API from '../../../src/api/axios';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EnrollFace() {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const navigate    = useNavigate();

  const [images,   setImages]   = useState([]);
  const [status,   setStatus]   = useState('idle');
  const [message,  setMessage]  = useState('We need 5 photos of your face');

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // ── CAPTURE ONE PHOTO ─────────────────────────────────────
  const capturePhoto = () => {
    if (images.length >= 5) return;

    const canvas = canvasRef.current;
    const video  = videoRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photo = canvas.toDataURL('image/jpeg', 0.8);

    const newImages = [...images, photo];
    setImages(newImages);
    setMessage(`Photo ${newImages.length}/5 captured. 
      ${newImages.length < 5
        ? 'Move your head slightly and capture again.'
        : 'All photos captured. Click Submit.'
      }`
    );
  };

  // ── SUBMIT ENROLLMENT ─────────────────────────────────────
  const handleEnroll = async () => {
    if (images.length < 5) {
      setMessage('Please capture all 5 photos first.');
      return;
    }

    try {
      setStatus('processing');
      setMessage('Enrolling your face. Please wait...');

      // ── THIS CALLS NODE.JS WHICH CALLS PYTHON ───────────
      const response = await API.post('http://localhost:3000/api/student/enroll', {
        images   // 5 base64 images
      });
      // ─────────────────────────────────────────────────────

      setStatus('success');
      setMessage('✅ Face enrolled! Waiting for admin approval.');

      // Redirect after 2 seconds
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 'Enrollment failed. Try again.'
      );
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <h2>Face Enrollment</h2>
      <p>Capture 5 photos of your face from slightly different angles</p>

      <video
        ref={videoRef}
        autoPlay
        muted
        width={400}
        height={300}
        style={{ borderRadius: 12 }}
      />

      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{ display: 'none' }}
      />

      {/* Progress indicator */}
      <div style={{ margin: '16px 0' }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} style={{
            display:      'inline-block',
            width:        24,
            height:       24,
            borderRadius: '50%',
            background:   images.length >= n ? 'green' : '#ddd',
            margin:       4
          }}/>
        ))}
      </div>

      <p>{message}</p>

      {/* Capture button */}
      {images.length < 5 && (
        <button
          onClick={capturePhoto}
          style={{
            padding:    '10px 24px',
            background: '#3b82f6',
            color:      'white',
            border:     'none',
            borderRadius: 8,
            margin:     8
          }}
        >
          📷 Capture Photo ({images.length}/5)
        </button>
      )}

      {/* Submit button — shows after 5 photos */}
      {images.length === 5 && status !== 'processing' && (
        <button
          onClick={handleEnroll}
          style={{
            padding:    '10px 24px',
            background: 'green',
            color:      'white',
            border:     'none',
            borderRadius: 8,
            margin:     8
          }}
        >
          Submit Enrollment
        </button>
      )}
    </div>
  );
}