const User = require("../models/user.model");

// ================= CREATE USER =================
async function createUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      resorts,
      defaultResort,
      stores,
      status,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, Email, Password and Role are required",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      resorts: resorts || [],
      defaultResort,
      stores: stores || [],
      status: status || "ACTIVE",
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("createUser error:", err);
    res.status(500).json({ message: "Failed to create user" });
  }
}

// ================= LIST USERS =================
async function listUsers(req, res) {
  try {
    const users = await User.find()
      .populate("resorts", "name")
      .populate("stores", "name")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("listUsers error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
}

// ================= UPDATE USER =================
async function updateUser(req, res) {
  try {
    const id = req.params.id;
    const payload = { ...req.body };

    // password update only if sent
    if (!payload.password) delete payload.password;

    const user = await User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
}

// ================= DELETE USER =================
async function deleteUser(req, res) {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
}

module.exports = {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
};
