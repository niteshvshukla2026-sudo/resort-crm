const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports = function createAuthController(mongoose) {
  const User = mongoose.model("User");

  const login = async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).populate("role resorts");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          id: user._id,
          role: user.role?.key,
          permissions: user.role?.permissions || [],
        },
        process.env.JWT_SECRET || "dev_secret",
        { expiresIn: "1d" }
      );

      res.json({ token, user });
    } catch (err) {
      console.error("login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  };

  return {
    login,
  };
};
