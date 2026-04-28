// frontend/src/pages/MarkAttendance.jsx
import { useRef, useState, useEffect } from "react";
import API from "../../api/axios";

const MarkAttendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Click button to mark attendance");
  const [location, setLocation] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  useEffect(() => {
    startCamera();
    getLocation();
    fetchSubjects();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      setMessage("Camera access denied");
    }
  };
  const fetchSubjects = async () => {
    try {
      const res = await API.get("http://localhost:3000/api/admin/subjects");
      console.log("Subjects API response:", res.data); // 👈 ADD THIS
      setSubjects(res.data || []);
      setTeacherId(res.data[0]?.teacher?._id || "");
    } catch (err) {
      console.error("Failed to fetch subjects");
    }
  };
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setMessage("Please enable GPS"),
    );
  };

  const captureFrames = (count = 15) => {
    return new Promise((resolve) => {
      const frames = [];
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");
      let captured = 0;

      const interval = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", 0.7));
        captured++;
        if (captured >= count) {
          clearInterval(interval);
          resolve(frames);
        }
      }, 200);
    });
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleMarkAttendance = async () => {
  if (!location) {
    setMessage('Waiting for GPS...');
    return;
  }

  if (!selectedSubject) {
    setMessage('❌ Please select a subject');
    return;
  }

  try {
    setStatus('processing');
    setMessage('Please blink naturally...');

    const frames = await captureFrames(15);

    await new Promise(res => setTimeout(res, 300));

    const image = captureImage();

    if (!image || image.length < 1000) {
      setMessage("❌ Camera capture failed");
      setStatus("error");
      return;
    }

    console.log("Sending image length:", image.length);

    const response = await API.post('/attendance/mark', {
      frames,
      image,
      lat: location.lat,
      lng: location.lng,
      subjectId: selectedSubject,
      teacherId: teacherId
    });

    setStatus('success');
    setMessage('✅ ' + response.data.message);

  } catch (error) {
    setStatus('error');
    const msg  = error.response?.data?.message || 'Something went wrong';
    const step = error.response?.data?.step;

    if (step === 'liveness') setMessage('❌ Liveness: ' + msg);
    else if (step === 'recognition') setMessage('❌ Face: ' + msg);
    else if (step === 'geofence') setMessage('❌ Location: ' + msg);
    else setMessage('❌ ' + msg);
  }
};

  return (
    <div style={{ textAlign: "center", padding: 24 }}>
      <h2>Mark Attendance</h2>
      <select
        value={selectedSubject}
        onChange={(e) => setSelectedSubject(e.target.value)}
        style={{ padding: "10px", margin: "10px 0", borderRadius: 8 }}
      >
        <option value="">Select Subject</option>

        {subjects.length > 0 ? (
          subjects.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name} && {teacherId}
            </option>
          ))
        ) : (
          <option disabled>No subjects found</option>
        )}
      </select>
      <video
        ref={videoRef}
        autoPlay
        muted
        width={400}
        height={300}
        style={{ borderRadius: 12, background: "#000" }}
      />

      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{ display: "none" }}
      />

      <p
        style={{
          color:
            status === "error"
              ? "red"
              : status === "success"
                ? "green"
                : "black",
          fontSize: 16,
          margin: "16px 0",
        }}
      >
        {message}
      </p>

      <p style={{ color: "gray", fontSize: 12 }}>
        {location
          ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
          : "📍 Getting location..."}
      </p>

      <button
        onClick={handleMarkAttendance}
        disabled={status === "processing" || !location}
        style={{
          padding: "12px 32px",
          fontSize: 16,
          background: status === "processing" ? "#ccc" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: status === "processing" ? "not-allowed" : "pointer",
        }}
      >
        {status === "processing" ? "Processing..." : "Mark Attendance"}
      </button>
    </div>
  );
};

export default MarkAttendance;
