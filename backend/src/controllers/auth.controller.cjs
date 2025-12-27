const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const genToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "secret123",
    { expiresIn: "7d" }
  );

// =======================
// LOGIN
// =======================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const User = mongoose.model("User");
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({ message: "User inactive" });
    }

    const token = genToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        resorts: user.resorts || [],
        defaultResort: user.defaultResort || null,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// =======================
// FORCE RESET (OPTIONAL)
// =======================
exports.forceResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.query;
    if (!email || !newPassword)
      return res.status(400).json({ message: "Missing params" });

    const User = mongoose.model("User");
    const hash = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { $set: { password: hash } });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Reset failed" });
  }
};
