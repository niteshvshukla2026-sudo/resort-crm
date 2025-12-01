// backend/server.cjs  (overwrite with this exact content)

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
  app.use(cors({ origin: frontend }));

  app.get('/_health', (req, res) => res.json({ ok: true }));

  let mongoose = null;
  let useMongo = false;
  if (process.env.MONGO_URI) {
    try {
      mongoose = require('mongoose');
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      useMongo = true;
      console.log('Mongo connected');
    } catch (e) {
      console.error('Mongo connect failed:', e && e.stack ? e.stack : e);
      mongoose = null;
      useMongo = false;
    }
  } else {
    console.warn('MONGO_URI not set, running without DB');
  }

  // === safe require + debug
  let router;
  try {
    const mod = require('./server_router.cjs');
    console.log('DEBUG: server_router module keys ->', mod && Object.keys(mod || {}));
    // Try multiple export shapes:
    if (mod && typeof mod.createRouter === 'function') {
      router = mod.createRouter({ useMongo, mongoose });
    } else if (typeof mod === 'function') {
      router = mod({ useMongo, mongoose });
    } else if (mod && mod.stack) {
      router = mod;
    } else {
      console.warn('server_router.cjs loaded but no usable export detected. module type:', typeof mod);
    }
  } catch (err) {
    console.error('Failed to require ./server_router.cjs — error:', err && err.stack ? err.stack : err);
  }

  if (router) {
    app.use('/', router);
    console.log('Router mounted at /');
  } else {
    console.warn('No router mounted — app running with minimal endpoints');
  }

  app.get('/', (req, res) => res.json({ ok: true, msg: 'root' }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch((e) => {
  console.error('Fatal start error:', e && e.stack ? e.stack : e);
  process.exit(1);
});
