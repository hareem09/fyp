const db = require("./config/dbs.js");
const express = require("express");
const app = express();
const {createDefaultAdmin} = require("./controller/auth/authController.js")
const authRoutes = require("./routes/auth/authRoutes.js");
const adminRoutes = require("./routes/adminRoutes/adminRoutes.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

 app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

createDefaultAdmin();

app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.listen(3000,()=>{
    console.log("server is running on port 3000");
})