const mongoose = require("mongoose");
const User = mongoose.models.User;

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  res.json(user);
};

exports.forceResetPassword = async (req, res) => {
  res.json({ ok: true });
};