module.exports = (router, mongoose) => {
  const User = mongoose.models.User;

  // =========================
  // GET USERS (RESORT-WISE)
  // =========================
  router.get("/api/users", async (req, res) => {
    try {
      const { resort } = req.query;

      const filter = {};
      if (resort && resort !== "ALL") {
        filter.resorts = resort;
      }

      const users = await User.find(filter)
        .populate("role")
        .populate("resorts")
        .lean();

      res.json(users);
    } catch (err) {
      console.error("GET /users error", err);
      res.status(500).json({ message: "Failed to load users" });
    }
  });

  // =========================
  // CREATE USER
  // =========================
  router.post("/api/users", async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        resorts,
        isActive = true,
      } = req.body;

      if (!email || !password || !role) {
        return res
          .status(400)
          .json({ message: "email, password & role are required" });
      }

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await User.create({
        name,
        email,
        password, // assume hashing middleware in model
        role,
        resorts: resorts || [],
        isActive,
      });

      res.status(201).json(user);
    } catch (err) {
      console.error("POST /users error", err);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // =========================
  // UPDATE USER
  // =========================
  router.put("/api/users/:id", async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.name = req.body.name ?? user.name;
      user.role = req.body.role ?? user.role;
      user.resorts = req.body.resorts ?? user.resorts;
      user.isActive = req.body.isActive ?? user.isActive;

      await user.save();
      res.json(user);
    } catch (err) {
      console.error("PUT /users error", err);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // =========================
  // DELETE USER
  // =========================
  router.delete("/api/users/:id", async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /users error", err);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
};
