import mongoose from "mongoose";

interface ConnectionState {
  isConnected: number;
}

const connection: ConnectionState = {
  isConnected: 0,
};

export async function Dbconnection() {
  if (connection.isConnected === 1 || mongoose.connection.readyState === 1) {
    connection.isConnected = mongoose.connection.readyState;
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in the environment variables.");
  }

  try {
    const mongoConnection = await mongoose.connect(mongoUri);
    connection.isConnected = mongoConnection.connections[0].readyState;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}