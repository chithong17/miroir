import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    return;
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const configs = await db.collection('shop_shipping_configs').find({}).toArray();
    console.log("Found shipping configs:", configs.length);
    configs.forEach(c => {
      console.log(`Provider: ${c.provider}, Active: ${c.is_active}, Token: ${c.credentials?.api_token ? 'YES' : 'NO'}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

run();
