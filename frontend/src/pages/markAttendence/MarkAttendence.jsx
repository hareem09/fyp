// frontend/src/pages/MarkAttendance.jsx
import { useRef, useState, useEffect } from "react";
import API from "../../api/axios";

const MarkAttendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Click button to mark attendance");
  const [location, setLocation] = useState(null);
  const [windowStatus, setWindowStatus] = useState(null);
  const [timeLeft,     setTimeLeft]     = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");

  useEffect(() => {
    startCamera();
    getLocation();
    fetchSubjects();
  
  }, []);
  //  const fetchWindow = async (selectedSubject) =>{
  //   try{
  //     const res = await API.get(`/teacher/attendance-window/${selectedSubject._id}`);
  //     setWindowStatus(res.data.data)
  //   }catch(err){
  //     console.error('Failed to fetch window status');
  //   }
  //  }
   // Check window status when subject selected
   useEffect(() => {
    if (selectedSubject) {
      checkWindow(selectedSubject);
      // Poll every 10 seconds
      const interval = setInterval(() => checkWindow(selectedSubject), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedSubject]);

  // Countdown for window
  useEffect(() => {
    if (windowStatus?.isOpen && windowStatus?.data?.expiresAt) {
      const interval = setInterval(() => {
        const remaining = new Date(windowStatus.data.expiresAt) - new Date();
        if (remaining <= 0) {
          setWindowStatus(prev => ({ ...prev, isOpen: false }));
          setTimeLeft(null);
          clearInterval(interval);
          return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft({ mins, secs });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [windowStatus]);

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
   
  const checkWindow = async (subjectId) => {
    try {
      const res = await API.get(`/teacher/attendance-window/active/${subjectId}`);
      setWindowStatus(res.data);
    } catch (err) {
      console.error('Failed to check window');
    }
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
      if (!windowStatus?.isOpen) {
      setMessage('Attendance window is closed. Ask your teacher to open it.');
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
    
     if (step === 'window')      setMessage('❌ Window closed: ' + msg);
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
       {/* Window Status */}
        {selectedSubject && windowStatus && (
          <div className={`rounded-2xl p-4 border
            ${windowStatus.isOpen
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full
                  ${windowStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                />
                <p className={`text-sm font-medium
                  ${windowStatus.isOpen ? 'text-green-700' : 'text-red-700'}`}
                >
                  {windowStatus.isOpen
                    ? 'Attendance window is OPEN'
                    : 'Attendance window is CLOSED'}
                </p>
              </div>
              {windowStatus.isOpen && timeLeft && (
                <span className={`text-sm font-bold tabular-nums
                  ${timeLeft.mins < 5 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {String(timeLeft.mins).padStart(2,'0')}:
                  {String(timeLeft.secs).padStart(2,'0')}
                </span>
              )}
            </div>
            {!windowStatus.isOpen && (
              <p className="text-xs text-red-500 mt-1">
                Ask your teacher to open the attendance window
              </p>
            )}
          </div>
        )}
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
