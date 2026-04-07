import mongoose from "mongoose";

declare global {
  var mongooseConn:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const mongooseCache = globalThis.mongooseConn ?? { conn: null, promise: null };
globalThis.mongooseConn = mongooseCache;

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("Missing MONGODB_URI in the server environment");
  }

  return uri;
}

export async function connectDB() {
  if (mongooseCache.conn) return mongooseCache.conn;

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(getMongoUri()).then((connection) => connection);
  }

  mongooseCache.conn = await mongooseCache.promise;
  return mongooseCache.conn;
}
