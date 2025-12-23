const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * IMPORTANT:
 * User model server_router.cjs me bana hua hai
 * aur global.User me attach hai
 */
const getUserModel = () => {
  if (!global.mongoose || !global.mongoose.models.User) {
    throw new Error("User model not ready yet");
  }
  return global.mongoose.models.User;
};


// -------------------------
// JWT TOKEN
// -------------------------
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

// -------------------------
// LOGIN
// -------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

const User = getUserModel();

    if (!User) {
      return res.status(500).json({ message: "User model not initialized" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status && user.status !== "ACTIVE") {
      return res.status(403).json({ message: "User inactive" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
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
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};

// -------------------------
// FORCE RESET PASSWORD (TEMP DEBUG)
// -------------------------
const forceResetPassword = async (req, res) => {
  try {
    const User = getUserModel();
    if (!User) {
      return res.status(500).json({ message: "User model not initialized" });
    }

    const user = await User.findOne({ email: "nitesh@example.com" });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    user.password = "090909"; // plain password
    await user.save();        // 🔥 pre-save hook chalega

    return res.json({ message: "Password reset done" });
  } catch (err) {
    console.error("FORCE RESET ERROR:", err);
    return res.status(500).json({ message: "Reset failed" });
  }
};

// -------------------------
// EXPORTS (CJS)
// -------------------------
module.exports = {
  login,
  forceResetPassword,
};
