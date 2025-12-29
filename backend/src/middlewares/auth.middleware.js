const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = mongoose.models.User;

const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_key"
    );

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role");

    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "User inactive or not found" });
    }

    req.user = {
      id: user._id,
      role: user.role?.name || user.role,
      isActive: user.isActive,
      resorts: user.resorts || [],
      stores: user.stores || [],
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR ❌", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ MUST BE A FUNCTION
const requirePermission = (module, action) => {
  return (req, res, next) => {
    // TEMP: allow all
    next();
  };
};

// ✅ SINGLE EXPORT (IMPORTANT)
module.exports = {
  protect,
  requirePermission,
};
