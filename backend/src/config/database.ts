import mongoose from 'mongoose';
import { appConfig } from '../config/app';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(appConfig.mongoUrl);
  } catch (error) {
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
  } catch (error) {}
};
