// backend/controllers.cjs

function createControllers({ useMongo, mongoose }) {
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
  // 🏨 RESORTS
  // --------------------------------
  async function listResorts(req, res) {
    return res.json({ ok: true, resorts: [] });
  }

  // --------------------------------
  // 🏬 DEPARTMENTS
  // --------------------------------
  async function listDepartments(req, res) {
    // demo / placeholder – currently returns empty list
    // later you can replace with real Mongo query
    // e.g. const departments = await Department.find().sort({ createdAt: -1 });
    const departments = [];
    return res.json({ ok: true, departments });
  }

  // --------------------------------
  // 📦 REQUISITIONS
  // --------------------------------
  async function listRequisitions(req, res) {
    return res.json({ ok: true, requisitions: [] });
  }

  async function createRequisition(req, res) {
    return res.json({ ok: true, created: true });
  }

  // --------------------------------
  // 📑 PURCHASE ORDERS
  // --------------------------------
  async function listPOs(req, res) {
    return res.json({ ok: true, pos: [] });
  }

  // --------------------------------
  // 📦 ITEMS
  // --------------------------------
  async function listItems(req, res) {
    return res.json({ ok: true, items: [] });
  }

  // --------------------------------
  // 👥 USERS / ROLES
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
    listResorts,
    listDepartments,
    listRequisitions,
    createRequisition,
    listPOs,
    listItems,
    listRoles,
    listUsers,
  };
}

module.exports = { createControllers };
