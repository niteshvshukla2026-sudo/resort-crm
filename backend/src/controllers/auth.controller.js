const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = mongoose.models.User;

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("role");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(401).json({ message: "User not active" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "dev_secret_key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR ❌", err);
    res.status(500).json({ message: "Login failed" });
  }
};
