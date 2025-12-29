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
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_key"
    );

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("role");

    // ✅ FIXED CHECK
    if (!user || user.isActive === false) {
      return res.status(401).json({
        message: "User inactive or not found",
      });
    }

    req.user = {
      id: user._id,
      role: user.role?.name || user.role, // safe
      resorts: user.resorts || [],
      stores: user.stores || [],
      isActive: user.isActive,
    };

    next();
  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR ❌", err);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
