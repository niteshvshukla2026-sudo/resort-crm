// backend/server.cjs  (overwrite with this exact content)

// ensure .env is loaded before anything else
try {
  require('dotenv').config();
} catch (e) {
  console.warn('dotenv load warning:', e && e.message);
}


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

  // --- IMPORTANT: read frontend origin from env, remove any trailing slash ---
  // Set FRONTEND_URL env on Render to: https://resort-crm.vercel.app
  let frontend = process.env.FRONTEND_URL || 'https://resort-crm.vercel.app';
  // remove trailing slash if present (this was the root cause of your CORS issue)
  frontend = String(frontend).replace(/\/+$/, '');

  // If someone sets '*' explicitly, allow but disable credentials
  const allowAllOrigins = frontend === '*' || frontend.toLowerCase() === 'all';

  // --- CORS configuration ---
  const corsOptions = {
    origin: allowAllOrigins ? true : frontend, // true allows reflect origin when needed
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    // If using cookies (httpOnly token), set credentials: true in both backend and frontend axios/fetch.
    credentials: !allowAllOrigins // only allow credentials when origin is explicit
  };

  // Place CORS BEFORE route handlers so preflight gets handled properly
  app.use(cors(corsOptions));

  // also explicitly respond to preflight for all routes (safe)
  app.options('*', cors(corsOptions));

  // parse JSON bodies
  app.use(express.json());

  // small health endpoint
  app.get('/_health', (req, res) => res.json({ ok: true }));

  // log the configured frontend origin for debugging
  console.log('CORS configured. FRONTEND_URL ->', frontend, '| allowAllOrigins:', allowAllOrigins);

  let mongoose = null;
  let useMongo = false;
  if (process.env.MONGO_URI) {
    try {
      mongoose = require('mongoose');
      // mongoose options - note: useUnifiedTopology and useNewUrlParser are common flags
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

  // === safe require + debug for router
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
    // Mount router at "/api" or root depending on how your router is structured.
    // If your routes expect /api prefix, change second argument: app.use('/api', router);
    app.use('/', router);
    console.log('Router mounted at /');
  } else {
    console.warn('No router mounted — app running with minimal endpoints');
  }

  // root fallback
  app.get('/', (req, res) => res.json({ ok: true, msg: 'root' }));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

start().catch((e) => {
  console.error('Fatal start error:', e && e.stack ? e.stack : e);
  process.exit(1);
});
