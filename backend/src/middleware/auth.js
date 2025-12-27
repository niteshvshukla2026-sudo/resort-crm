const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

module.exports = async function auth(req, res, next) {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Auth token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    const User = mongoose.model("User");
    const user = await User.findById(decoded.id).lean();

    if (!user || user.status === "INACTIVE") {
      return res.status(401).json({ message: "Invalid user" });
    }

    req.user = {
      id: user._id,
      role: user.role,
      permissions: user.permissions || [],
      resorts: user.resorts || [],
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
