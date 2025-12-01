// backend/server_router.js
const express = require('express');
const { createControllers } = require('./controllers');

function createRouter({ useMongo, mongoose }) {
  const router = express.Router();
  const controllers = createControllers({ useMongo, mongoose });

  // Demo-auth helper:
  // If you send header `x-demo-user` with JSON string, that becomes req.user.
  // Example header: x-demo-user: {"id":"user_1","name":"Amit","role":"RESORT_USER","resorts":["resort_1"]}
  // In production replace with real JWT middleware.
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

  // Dashboard & master endpoints
  router.get('/dashboard/resort/:resortId/kpi', controllers.getResortKpi);
  router.get('/resorts', controllers.listResorts);

  // Requisition endpoints
  router.get('/requisitions', controllers.listRequisitions);
  router.post('/requisitions', controllers.createRequisition);

  // PO endpoint
  router.get('/po', controllers.listPOs);

  // Items
  router.get('/items', controllers.listItems);

  // Roles / Users compatibility endpoints (used by UI)
  router.get('/roles', controllers.listRoles);
  router.get('/users', controllers.listUsers);

  return router;
}

module.exports = { createRouter };
