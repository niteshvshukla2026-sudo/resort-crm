import User from "../models/User.js";

export const createUser = async (req, res) => {
  const { name, email, password, role, resorts } = req.body;
  const user = await User.create({ name, email, password, role, resorts });
  res.status(201).json(user);
};

export const listUsers = async (req, res) => {
  const users = await User.find().populate("resorts", "name code");
  res.json(users);
};
