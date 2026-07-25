const app = require('../app');
const connectDB = require('../config/db');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('Database connection error in Vercel serverless function:', err);
    }
  }
  return app(req, res);
};
