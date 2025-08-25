import mongoose from 'mongoose';
import { appConfig } from '../config/app';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(appConfig.mongoUrl);
    console.log(`📦 MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📦 MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};
