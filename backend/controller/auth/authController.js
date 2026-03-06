const User = require("../../model/userModel/userSchema.js");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const utilsToken = require("../../utils/generateToken.js");
dotenv.config();


const { generateAuthToken, generateRefreshToken } = utilsToken;

const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('✅ Admin already exists — skipping creation');
      return;
    }

    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@1234', salt);

    // Create admin
    await User.create({
      name: 'Super Admin',
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@smartattendance.com',
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'active',
      enrollmentStatus: 'not_enrolled'
    });

    console.log('✅ Default admin created successfully');
    console.log(`📧 Email   : ${process.env.ADMIN_DEFAULT_EMAIL || 'admin@smartattendance.com'}`);
    console.log(`🔑 Password: ${process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@1234'}`);
    console.log('⚠️  Please change the default password after first login');

  } catch (error) {
    console.error('❌ Failed to create default admin:', error.message);
  }
};

const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Role check — only students allowed here
    if (user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied. Use admin portal.' });
    }

    // Account status checks
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'Account not activated. Check your email.' });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAuthToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("authToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollment:{
            rollNo: user.rollNo,
            department: user.department,
            semester: user.semester,
            batch: user.batch
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Admin/Teacher login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Role check — only admin and teacher allowed here
    if (!['admin', 'teacher'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Use student portal.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.authToken; //from httpOnly cookie

  if (!refreshToken) {
    res.status(400).json({
      message: "No refresh token provided",
    });
  }


  //clear cookie
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });

  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await authModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Normally send email here
    const resetLink = `http://localhost:5000/api/auth/reset-password/${resetToken}`;

    res.status(200).json({
      message: "Reset link generated",
      resetLink,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }}

const resetPassword = async (req, res) => {
   try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await authModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const refreshAccessToken = async (req, res) => {
    try{
  const refreshToken = req.cookies.authToken;
  console.log(refreshToken)
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
    const user = await authModel.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      accessToken: newAccessToken,
    });

  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

module.exports = {
  createDefaultAdmin,
  studentLogin,
  adminLogin,
  logout,
  forgetPassword,
  resetPassword,
  refreshAccessToken,
};
