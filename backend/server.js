const db = require("./config/dbs.js");
const express = require("express");
const app = express();

const authRoutes = require("./routes/authRoutes.js");

app.use(express.json());

app.use("/api/auth",authRoutes);

app.listen(3000,()=>{
    console.log("server is running on port 3000");
})