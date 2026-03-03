const authController = require("../../controller/auth/authControllerjs")
const express = require("express")
const router = express.Router();

const{
    studentLogin,
    adminLogin,
    logout,
    forgetPassword,
    resetPassword,
    refreshAccessToken
} = authController;


router.post("/login/student",studentLogin);
router.post("/login/admin",adminLogin);
router.post("/logout",logout);
router.post("/forget-password",forgetPassword);
router.post("/reset-password/:token",resetPassword);
router.get("/refresh-token",refreshAccessToken);

module.exports = router;