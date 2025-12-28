module.exports = function createUserController(mongoose) {
  const User = mongoose.model("User");


  // ================= GET USERS =================
  const listUsers = async (req, res) => {
    try {
      const users = await User.find()
        .populate("resorts", "name")
        .populate("stores", "name")
        .sort({ name: 1 });

      res.json(users);
    } catch (err) {
      console.error("listUsers error:", err);
      res.status(500).json({ message: "Failed to load users" });
    }
  };

  // ================= CREATE USER =================
  const createUser = async (req, res) => {
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
          message: "Name, email, password & role are required",
        });
      }

      if (!Array.isArray(resorts) || resorts.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one resort is required" });
      }

      if (!Array.isArray(stores) || stores.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one store is required" });
      }

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
        resorts,
        defaultResort,
        stores,
        status: status || "ACTIVE",
      });

      res.json(user);
    } catch (err) {
      console.error("createUser error:", err);
      res.status(500).json({ message: "Failed to create user" });
    }
  };

  // ================= UPDATE USER =================
  const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      if (payload.password) {
        // allow password update
      } else {
        delete payload.password;
      }

      const user = await User.findByIdAndUpdate(id, payload, {
        new: true,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (err) {
      console.error("updateUser error:", err);
      res.status(500).json({ message: "Failed to update user" });
    }
  };

  // ================= DELETE USER =================
  const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await User.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteUser error:", err);
      res.status(500).json({ message: "Failed to delete user" });
    }
  };

  return {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
