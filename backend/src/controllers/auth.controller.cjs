const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * IMPORTANT:
 * User model server_router.cjs me bana hua hai
 * aur global.mongoose me attach hai
 */

// -------------------------
// GET USER MODEL SAFELY
// -------------------------
const getUserModel = () => {
  if (!global.mongoose) {
    throw new Error("Mongoose not initialized");
  }

  if (!global.mongoose.models || !global.mongoose.models.User) {
    throw new Error("User model not registered");
  }

  return global.mongoose.models.User;
};

// -------------------------
// JWT TOKEN
// -------------------------
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET || "dev_secret_key", // 🔥 crash-safe
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

// -------------------------
// LOGIN
// -------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email & password required",
      });
    }

    const User = getUserModel();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // status check (optional)
    if (user.status && user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User inactive",
      });
    }

    // password check
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        resorts: user.resorts || [],
        stores: user.stores || [],
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR ❌", err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// -------------------------
// FORCE RESET PASSWORD (TEMP DEBUG)
// -------------------------
const forceResetPassword = async (req, res) => {
  try {
    const User = getUserModel();

    const user = await User.findOne({
      email: req.body.email || "nitesh@example.com",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = req.body.password || "090909"; // plain text
    await user.save(); // 🔥 pre-save bcrypt hook chalega

    return res.json({
      success: true,
      message: "Password reset done",
    });
  } catch (err) {
    console.error("FORCE RESET ERROR ❌", err);
    return res.status(500).json({
      success: false,
      message: "Reset failed",
    });
  }
};

// -------------------------
// EXPORTS (CJS)
// -------------------------
module.exports = {
  login,
  forceResetPassword,
};
