import dotenv from "dotenv";
import {
  getEmbeddingTextBuilder,
  hashEmbeddingText,
} from "../services/embeddingText.service.js";
import { generateEmbedding } from "../services/gemini.service.js";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();

const collectionName = process.argv[2];
const supportedCollections = ["products", "outfits", "fashion_rules"];

if (!supportedCollections.includes(collectionName)) {
  console.error(
    `Usage: node scripts/embedCollection.js <${supportedCollections.join("|")}>`
  );
  process.exit(1);
}

const builder = getEmbeddingTextBuilder(collectionName);

const run = async () => {
  const db = await getMongoDb();
  const collection = db.collection(collectionName);
  const cursor = collection.find({}).batchSize(25);
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for await (const document of cursor) {
    const text = builder(document);
    const embeddingTextHash = hashEmbeddingText(text);

    if (!text.trim()) {
      skipped += 1;
      console.warn(`Skipped empty embedding text for ${document.id || document._id}`);
      continue;
    }

    if (document.embeddingTextHash === embeddingTextHash && document.embedding) {
      if (collectionName === "products" && document.embeddingStale) {
        const selector = document._id ? { _id: document._id } : { id: document.id };
        await collection.updateOne(selector, {
          $set: {
            embeddingStale: false,
            embeddingUpdatedAt: document.embeddingUpdatedAt || new Date(),
          },
        });
      }
      skipped += 1;
      continue;
    }

    try {
      const embedding = await generateEmbedding(text);
      const selector = document._id ? { _id: document._id } : { id: document.id };

      await collection.updateOne(selector, {
        $set: {
          embedding,
          embeddingTextHash,
          embeddingUpdatedAt: new Date(),
          ...(collectionName === "products" ? { embeddingStale: false } : {}),
        },
      });
      updated += 1;
      console.log(`Embedded ${collectionName}:${document.id || document._id}`);
    } catch (error) {
      failed += 1;
      console.error(
        `Failed to embed ${collectionName}:${document.id || document._id}`,
        error.message
      );
    }
  }

  console.log(
    `Embedding complete for ${collectionName}. updated=${updated} skipped=${skipped} failed=${failed}`
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongoConnection();
  });
