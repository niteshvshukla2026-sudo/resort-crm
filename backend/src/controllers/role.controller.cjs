module.exports = function createRoleController(mongoose) {
  const Role = mongoose.model("Role");

  // ================= GET =================
  const listRoles = async (req, res) => {
    try {
      const roles = await Role.find().sort({ name: 1 });
      res.json(roles);
    } catch (err) {
      console.error("listRoles error:", err);
      res.status(500).json({ message: "Failed to load roles" });
    }
  };

  // ================= CREATE =================
  const createRole = async (req, res) => {
    try {
      const payload = req.body;

      if (!payload.name || !payload.key) {
        return res
          .status(400)
          .json({ message: "Role name and key are required" });
      }

      const exists = await Role.findOne({ key: payload.key });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Role key already exists" });
      }

      const role = await Role.create({
        name: payload.name,
        key: payload.key,
        description: payload.description || "",
        type: payload.type || "CUSTOM",
        storeMode: payload.storeMode || "MULTI",
        permissions: payload.permissions || [],
      });

      res.json(role);
    } catch (err) {
      console.error("createRole error:", err);
      res.status(500).json({ message: "Failed to create role" });
    }
  };

  // ================= UPDATE =================
  const updateRole = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = req.body;

      const existing = await Role.findById(id);
      if (!existing) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (existing.type === "SYSTEM") {
        payload.key = existing.key;
        payload.type = "SYSTEM";
      }

      const role = await Role.findByIdAndUpdate(id, payload, {
        new: true,
      });

      res.json(role);
    } catch (err) {
      console.error("updateRole error:", err);
      res.status(500).json({ message: "Failed to update role" });
    }
  };

  // ================= DELETE =================
  const deleteRole = async (req, res) => {
    try {
      const { id } = req.params;
      const role = await Role.findByIdAndDelete(id);

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteRole error:", err);
      res.status(500).json({ message: "Failed to delete role" });
    }
  };

  return {
    listRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};
