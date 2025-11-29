import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email & password required" });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await user.matchPassword(password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      resorts: user.resorts,
    },
  });
};

// One-time use: create first super admin if none exists
export const createInitialSuperAdmin = async (req, res) => {
  const existing = await User.findOne({ role: "SUPER_ADMIN" });
  if (existing) {
    return res.status(400).json({ message: "Super admin already exists" });
  }
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password, role: "SUPER_ADMIN" });
  res.status(201).json({
    message: "Super admin created",
    id: user._id,
  });
};
