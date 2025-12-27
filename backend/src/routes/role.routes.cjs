module.exports = (router, mongoose) => {
  const Role = mongoose.models.Role;

  // =========================
  // GET ALL ROLES
  // =========================
  router.get("/api/roles", async (req, res) => {
    try {
      const roles = await Role.find().sort({ name: 1 }).lean();
      res.json(roles);
    } catch (err) {
      console.error("GET /roles error", err);
      res.status(500).json({ message: "Failed to load roles" });
    }
  });

  // =========================
  // CREATE ROLE
  // =========================
  router.post("/api/roles", async (req, res) => {
    try {
      const { name, permissions } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }

      const role = await Role.create({
        name,
        permissions: permissions || [],
      });

      res.status(201).json(role);
    } catch (err) {
      console.error("POST /roles error", err);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  // =========================
  // UPDATE ROLE
  // =========================
  router.put("/api/roles/:id", async (req, res) => {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) return res.status(404).json({ message: "Role not found" });

      role.name = req.body.name ?? role.name;
      role.permissions = req.body.permissions ?? role.permissions;

      await role.save();
      res.json(role);
    } catch (err) {
      console.error("PUT /roles error", err);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // =========================
  // DELETE ROLE
  // =========================
  router.delete("/api/roles/:id", async (req, res) => {
    try {
      await Role.findByIdAndDelete(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("DELETE /roles error", err);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });
};
