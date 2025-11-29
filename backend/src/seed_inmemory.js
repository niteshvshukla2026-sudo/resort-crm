
// Manual seed script: run with `node src/seed_inmemory.js` from backend root (requires node)
const inmem = require('./inmemoryDb');
console.log('Seeding in-memory DB...');
const res = inmem.seed();
console.log('Seed result:', res);
