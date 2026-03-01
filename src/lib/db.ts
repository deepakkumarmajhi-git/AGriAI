import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

// Prevent multiple connections in dev (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

global.mongooseConn = global.mongooseConn || { conn: null, promise: null };

export async function connectDB() {
  if (global.mongooseConn.conn) return global.mongooseConn.conn;

  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: undefined, // if your URI already includes db name
      })
      .then((mongoose) => mongoose);
  }

  global.mongooseConn.conn = await global.mongooseConn.promise;
  return global.mongooseConn.conn;
}