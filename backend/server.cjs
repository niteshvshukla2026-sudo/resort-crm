// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const serverRouter = require('./server_router.cjs');


const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI || "";

async function start() {
  let useMongo = false;
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to MongoDB');
      useMongo = true;
    } catch (e) {
      console.error('Mongo connection failed, falling back to in-memory', e);
    }
  }

  const router = createRouter({ useMongo, mongoose });

  app.use('/api', router);

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
  });
}

start();
