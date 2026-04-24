const db = require("./config/dbs.js");
const express = require("express");
const app = express();
const {createDefaultAdmin} = require("./controller/auth/authController.js")
const authRoutes = require("./routes/auth/authRoutes.js");
const adminRoutes = require("./routes/adminRoutes/adminRoutes.js");
const studentRoutes = require("./routes/studentRoutes/studentRoute.js");
const attendenceRoutes = require("./routes/studentRoutes/attendenceRoutes.js");

const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
app.use(express.json({ limit: '50mb' }));
 app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '50mb'  }));

createDefaultAdmin();

app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/student",studentRoutes);
app.use('/api/attendance',attendenceRoutes);
app.listen(3000,()=>{
    console.log("server is running on port 3000");
})