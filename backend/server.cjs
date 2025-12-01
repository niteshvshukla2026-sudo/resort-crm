// backend/server.cjs
/* Safe server startup: robust require of server_router.cjs and optional mongoose connect */

const express = require('express');
const cors = require('cors');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION ❌', err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION ❌', reason && reason.stack ? reason.stack : reason);
  process.exit(1);
});

async function start() {
  const app = express();
  app.use(express.json());

  const frontend = process.env.FRONTEND_URL || '*';
  app.use(cors({
    origin: frontend,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-demo-user'
  }));

  app.get('/_health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'not-set' }));

  // optional mongoose connect
  let mongoose = null;
  let useMongo = false;
  if (process.env.MONGO_URI) {
    try {
      mongoose = require('mongoose');
      const options = { useNewUrlParser: true, useUnifiedTopology: true };
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(process.env.MONGO_URI, options);
      console.log('MongoDB connected.');
      useMongo = true;
    } catch (err) {
      console.error('MongoDB connection failed — continuing without DB:', err && err.stack ? err.stack : err);
      mongoose = null;
      useMongo = false;
    }
  } else {
    console.warn('MONGO_URI not set — running without DB.');
  }

  // safe require of server router module (handle multiple export shapes)
  let router;
  try {
    const mod = require('./server_router.cjs');

    // 1) module.exports = { createRouter }
    if (mod && typeof mod.createRouter === 'function') {
      router = mod.createRouter({ useMongo, mongoose });
    }
    // 2) module.exports = createRouter (function)
    else if (typeof mod === 'function') {
      // if user exported function that returns router
      router = mod({ useMongo, mongoose });
    }
    // 3) module.exports = router (express.Router)
    else if (mod && mod.stack) { // express.Router has .stack
      router = mod;
    } else {
      console.warn('server_router.cjs loaded but no usable export detected:', Object.keys(mod || {}));
    }
  } catch (err) {
    console.error('Failed to load ./server_router.cjs — continuing with minimal server. Error:', err && err.stack ? err.stack : err);
  }

  if (router) {
    app.use('/', router);
    console.log('Router mounted at /');
  } else {
    console.warn('No router mounted — app running with minimal endpoints.');
  }

  app.get('/', (req, res) => res.json({ ok: true, msg: 'Server up (root)' }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} — NODE_ENV=${process.env.NODE_ENV || 'not-set'}`);
  });
}

start().catch((e) => {
  console.error('Fatal start() error:', e && e.stack ? e.stack : e);
  process.exit(1);
});
