import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = env.mongoUri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[db] connected to ${mongoose.connection.name}`);
  } catch (err) {
    console.error(
      '[db] Could not connect to MongoDB.\n' +
        '     Check MONGO_URI, your Atlas database user/password, and that your IP\n' +
        '     (or 0.0.0.0/0 for Render) is allowed under Atlas > Network Access.\n',
      err.message
    );
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
