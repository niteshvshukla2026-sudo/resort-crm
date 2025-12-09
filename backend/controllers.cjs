// backend/controllers.cjs

function createControllers({ useMongo, mongoose }) {
  // ----------------------------
  // 🔗 MONGOOSE MODELS (generic)
  // ----------------------------
  let Resort = null;
  let Department = null;

  if (mongoose) {
    // Generic schema: any fields allowed, timestamps on
    const resortSchema =
      mongoose.models.Resort?.schema ||
      new mongoose.Schema({}, { strict: false, timestamps: true });
    Resort = mongoose.models.Resort || mongoose.model("Resort", resortSchema);

    const departmentSchema =
      mongoose.models.Department?.schema ||
      new mongoose.Schema({}, { strict: false, timestamps: true });
    Department =
      mongoose.models.Department ||
      mongoose.model("Department", departmentSchema);
  }

  const ensureModel = (model, name) => {
    if (!model) {
      const msg = `${name} model not initialised`;
      console.error(msg);
      const err = new Error(msg);
      err.statusCode = 500;
      throw err;
    }
  };

  // --------------------------------
  // 🔐 LOGIN CONTROLLER
  // --------------------------------
  async function login(req, res) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res
          .status(400)
          .json({ ok: false, error: "email and password required" });
      }

      // DEMO login logic (replace with real DB + bcrypt + JWT)
      if (email === "admin@example.com" && password === "123456") {
        const user = {
          id: "admin_1",
          email,
          role: "SUPER_ADMIN",
          name: "Admin User",
        };

        const token = "demo-token-123"; // Replace with JWT later

        return res.json({
          ok: true,
          token,
          user,
        });
      }

      return res
        .status(401)
        .json({ ok: false, error: "Invalid credentials" });
    } catch (err) {
      console.error("Login error:", err);
      return res
        .status(500)
        .json({ ok: false, error: "server error" });
    }
  }

  // --------------------------------
  // 🏨 DASHBOARD
  // --------------------------------
  async function getResortKpi(req, res) {
    return res.json({ ok: true, kpi: {} });
  }

  // --------------------------------
  // 🏨 RESORTS (MongoDB)
  // --------------------------------
  async function listResorts(req, res) {
    try {
      ensureModel(Resort, "Resort");
      const resorts = await Resort.find().sort({ createdAt: -1 }).lean();
      return res.json({ ok: true, resorts });
    } catch (err) {
      console.error("listResorts error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  async function createResort(req, res) {
    try {
      ensureModel(Resort, "Resort");
      const data = req.body || {};
      // agar code nahi diya to simple code generate kar lo
      if (!data.code && data.name) {
        const initials = data.name
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 4)
          .toUpperCase();
        data.code = initials || "R" + Math.floor(Math.random() * 9999);
      }
      const created = await Resort.create(data);
      return res.json({ ok: true, resort: created });
    } catch (err) {
      console.error("createResort error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  async function updateResort(req, res) {
    try {
      ensureModel(Resort, "Resort");
      const { id } = req.params;
      const updated = await Resort.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updated) {
        return res
          .status(404)
          .json({ ok: false, message: "Resort not found" });
      }
      return res.json({ ok: true, resort: updated });
    } catch (err) {
      console.error("updateResort error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  async function deleteResort(req, res) {
    try {
      ensureModel(Resort, "Resort");
      const { id } = req.params;
      const deleted = await Resort.findByIdAndDelete(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ ok: false, message: "Resort not found" });
      }
      return res.json({ ok: true, message: "Resort deleted" });
    } catch (err) {
      console.error("deleteResort error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  // --------------------------------
  // 🏬 DEPARTMENTS (MongoDB)
  // --------------------------------
  async function listDepartments(req, res) {
    try {
      ensureModel(Department, "Department");
      const departments = await Department.find()
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ ok: true, departments });
    } catch (err) {
      console.error("listDepartments error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  async function createDepartment(req, res) {
    try {
      ensureModel(Department, "Department");
      const data = req.body || {};
      if (!data.code && data.name) {
        const initials = data.name
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 4)
          .toUpperCase();
        data.code = initials || "D" + Math.floor(Math.random() * 9999);
      }
      const created = await Department.create(data);
      return res.json({ ok: true, department: created });
    } catch (err) {
      console.error("createDepartment error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  async function updateDepartment(req, res) {
    try {
      ensureModel(Department, "Department");
      const { id } = req.params;
      const updated = await Department.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updated) {
        return res
          .status(404)
          .json({ ok: false, message: "Department not found" });
      }
      return res.json({ ok: true, department: updated });
    } catch (err) {
      console.error("updateDepartment error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  async function deleteDepartment(req, res) {
    try {
      ensureModel(Department, "Department");
      const { id } = req.params;
      const deleted = await Department.findByIdAndDelete(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ ok: false, message: "Department not found" });
      }
      return res.json({ ok: true, message: "Department deleted" });
    } catch (err) {
      console.error("deleteDepartment error:", err);
      return res
        .status(err.statusCode || 500)
        .json({ ok: false, message: err.message || "Server error" });
    }
  }

  // --------------------------------
  // 📦 REQUISITIONS  (demo)
  // --------------------------------
  async function listRequisitions(req, res) {
    return res.json({ ok: true, requisitions: [] });
  }

  async function createRequisition(req, res) {
    return res.json({ ok: true, created: true });
  }

  // --------------------------------
  // 📑 PURCHASE ORDERS (demo)
  // --------------------------------
  async function listPOs(req, res) {
    return res.json({ ok: true, pos: [] });
  }

  // --------------------------------
  // 📦 ITEMS (demo)
  // --------------------------------
  async function listItems(req, res) {
    return res.json({ ok: true, items: [] });
  }

  // --------------------------------
  // 👥 USERS / ROLES (demo)
  // --------------------------------
  async function listRoles(req, res) {
    return res.json({ ok: true, roles: [] });
  }

  async function listUsers(req, res) {
    return res.json({ ok: true, users: [] });
  }

  // --------------------------------
  // RETURN ALL CONTROLLERS
  // --------------------------------
  return {
    login,
    getResortKpi,

    // Resorts
    listResorts,
    createResort,
    updateResort,
    deleteResort,

    // Departments
    listDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,

    // Others (demo)
    listRequisitions,
    createRequisition,
    listPOs,
    listItems,
    listRoles,
    listUsers,
  };
}

module.exports = { createControllers };
