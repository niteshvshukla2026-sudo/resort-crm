// testenv.js (put this file in backend/)
require('dotenv').config();
console.log('MONGO_URI (from .env) =', process.env.MONGO_URI ? '[SET]' : '[NOT SET]');
