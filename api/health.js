import mongoose from 'mongoose';
import { connectToDatabase } from '../api-lib/db.js';

export default async function handler(req, res) {
  const env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NVIDIA_API_KEY: !!process.env.NVIDIA_API_KEY,
  };

  try {
    await connectToDatabase();
    return res.json({
      status: 'ok',
      env,
      mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      env,
      mongo: 'disconnected',
      error: err.message,
    });
  }
}
