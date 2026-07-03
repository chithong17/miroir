import { MongoClient } from "mongodb";

let client;
let db;

export const getMongoDb = async () => {
  if (db) {
    return db;
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

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: Number(
      process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 8000
    ),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 8000),
  });
  await client.connect();
  db = client.db(dbName);
  return db;
};

export const closeMongoConnection = async () => {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
};
