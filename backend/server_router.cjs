// backend/server_router.cjs

const express = require('express');
const { createControllers } = require('./controllers.cjs');

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers({ useMongo, mongoose });

  // Demo-auth header (optional, used earlier in your setup)
  router.use((req, res, next) => {
    const demo = req.header('x-demo-user');
    if (demo) {
      try {
        req.user = JSON.parse(demo);
      } catch (e) {
        req.user = { id: demo, name: 'Demo User', role: 'RESORT_USER', resorts: [] };
      }
    }
    next();
  });

  // ------------------------
  // 🔐 AUTH ROUTES
  // ------------------------
  router.post('/api/auth/login', controllers.login);

  // ------------------------
  // 📊 Dashboard
  // ------------------------
  router.get('/dashboard/resort/:resortId/kpi', controllers.getResortKpi);

  // ------------------------
  // 🏨 Resorts
  // ------------------------
   router.get('/api/resorts', controllers.listResorts);

  // ------------------------
  // 📦 Requisition
  // ------------------------
  router.get('/requisitions', controllers.listRequisitions);
  router.post('/requisitions', controllers.createRequisition);

  // ------------------------
  // 📑 Purchase Orders
  // ------------------------
  router.get('/po', controllers.listPOs);

  // ------------------------
  // 📦 Items
  // ------------------------
  router.get('/items', controllers.listItems);

  // ------------------------
  // 👥 Roles / Users
  // ------------------------
  router.get('/roles', controllers.listRoles);
  router.get('/users', controllers.listUsers);

  return router;
}

module.exports = { createRouter };
