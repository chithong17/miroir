import { MongoClient } from "mongodb";

let client;
let db;
let connectionPromise;

export const getMongoDb = async () => {
  if (db) {
    return db;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    const error = new Error(
      "MongoDB is not configured. Set MONGODB_URI and MONGODB_DB_NAME."
    );
    error.statusCode = 503;
    throw error;
  }

  connectionPromise = (async () => {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: Number(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 8000
      ),
      connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 8000),
    });
    await client.connect();
    db = client.db(dbName);
    return db;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = undefined;
    client = undefined;
    throw error;
  }
};

export const withMongoTransaction = async (work) => {
  await getMongoDb();
  const session = client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(db, session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

export const closeMongoConnection = async () => {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
    connectionPromise = undefined;
  }
};
