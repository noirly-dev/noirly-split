import mongoose from "mongoose";

function resolveSplitDbName(uri: string): string | undefined {
  try {
    const normalized = uri.replace(/^mongodb(\+srv)?:/i, "http:");
    const pathname = new URL(normalized).pathname.replace(/^\//, "");
    const name = pathname.split("/")[0];
    const isAtlas = /mongodb\+srv:|\.mongodb\.net/i.test(uri);
    if (isAtlas && (!name || name === "test")) return "noirly-split";
    return name || undefined;
  } catch {
    return /mongodb\+srv:|\.mongodb\.net/i.test(uri) ? "noirly-split" : undefined;
  }
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var splitMongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.splitMongooseCache ?? {
  conn: null,
  promise: null,
};

global.splitMongooseCache = cache;

export async function connectMongo(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required (use database name noirly-split)");
  }

  if (!cache.promise) {
    const dbName = resolveSplitDbName(uri);
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
      ...(dbName ? { dbName } : {}),
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  await connectMongo();
  return fn();
}
