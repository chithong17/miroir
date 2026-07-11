import crypto from "crypto";
import dotenv from "dotenv";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";

dotenv.config();

const MOCK_SEED = "shop-a-insights-v1";
const DEFAULT_SHOP_QUERY = "shop-a";
const USER_IDS = ["mock-user-a-01", "mock-user-a-02", "mock-user-a-03", "mock-user-a-04", "mock-user-a-05"];

const daysAgo = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
};

const normalize = (value = "") => String(value).trim().toLowerCase();

const findShop = async (db, query) => {
  const raw = String(query || DEFAULT_SHOP_QUERY).trim();
  const exact = await db.collection("shops").findOne({
    $or: [{ id: raw }, { slug: raw }, { name: raw }],
  });

  if (exact) return exact;

  return db.collection("shops").findOne({
    $or: [
      { slug: { $regex: raw, $options: "i" } },
      { name: { $regex: raw, $options: "i" } },
    ],
  });
};

const createFallbackProducts = async (db, shop) => {
  const now = new Date();
  const products = [
    {
      id: `${shop.id}-mock-linen-dress`,
      name: "Mock Linen Midi Dress",
      category: "dress",
      description: "Mock product for customer insight testing.",
      colors: ["white", "beige"],
      sizes: ["S", "M", "L"],
      price: 690000,
      gender: "female",
      availability: "in_stock",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      styleTags: ["minimalist", "smart casual"],
      occasionTags: ["party", "date"],
      material: "linen",
      fitType: "relaxed",
    },
    {
      id: `${shop.id}-mock-blazer`,
      name: "Mock Cropped Blazer",
      category: "blazer",
      description: "Mock product for customer insight testing.",
      colors: ["black", "navy"],
      sizes: ["S", "M"],
      price: 890000,
      gender: "female",
      availability: "in_stock",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      styleTags: ["office", "modern"],
      occasionTags: ["office", "meeting"],
      material: "polyester",
      fitType: "regular",
    },
    {
      id: `${shop.id}-mock-wide-leg-pants`,
      name: "Mock Wide Leg Pants",
      category: "pants",
      description: "Mock product for customer insight testing.",
      colors: ["cream", "brown"],
      sizes: ["M", "L"],
      price: 520000,
      gender: "unisex",
      availability: "in_stock",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      styleTags: ["casual", "minimalist"],
      occasionTags: ["daily", "office"],
      material: "cotton",
      fitType: "wide",
    },
  ].map((product) => ({
    ...product,
    shopId: shop.id,
    status: "published",
    embeddingStale: true,
    createdAt: now,
    updatedAt: now,
    mockSeed: MOCK_SEED,
  }));

  await db.collection("products").insertMany(products);
  return products;
};

const buildEvent = ({ eventType, shop, product, userId, createdAt, metadata = {} }) => ({
  id: crypto.randomUUID(),
  eventType,
  shopId: shop.id,
  productId: product?.id || "",
  userId,
  metadata: {
    ...metadata,
    mockSeed: MOCK_SEED,
  },
  createdAt,
});

const profileSamples = [
  {
    gender: "female",
    bodyShape: "pear",
    skinTone: "warm",
    stylePreferences: ["minimalist", "smart casual"],
    occasion: "party",
    budget: { min: 300000, max: 700000 },
    rating: 5,
  },
  {
    gender: "female",
    bodyShape: "hourglass",
    skinTone: "neutral",
    stylePreferences: ["modern", "office"],
    occasion: "office",
    budget: { min: 700000, max: 1500000 },
    rating: 4,
  },
  {
    gender: "female",
    bodyShape: "rectangle",
    skinTone: "cool",
    stylePreferences: ["minimalist", "casual"],
    occasion: "date",
    budget: { min: 300000, max: 700000 },
    rating: 5,
  },
  {
    gender: "unisex",
    bodyShape: "inverted triangle",
    skinTone: "warm",
    stylePreferences: ["streetwear", "casual"],
    occasion: "daily",
    budget: { min: 0, max: 300000 },
    rating: 3,
  },
  {
    gender: "female",
    bodyShape: "pear",
    skinTone: "warm",
    stylePreferences: ["smart casual", "modern"],
    occasion: "meeting",
    budget: { min: 700000, max: 1500000 },
    rating: 4,
  },
];

const buildMockEvents = ({ shop, products }) => {
  const events = [];

  profileSamples.forEach((sample, index) => {
    const userId = USER_IDS[index];
    const primaryProduct = products[index % products.length];
    const secondaryProduct = products[(index + 1) % products.length];
    const baseProfile = {
      gender: sample.gender,
      bodyShape: sample.bodyShape,
      skinTone: sample.skinTone,
      stylePreferences: sample.stylePreferences,
    };

    events.push(
      buildEvent({
        eventType: "product_view",
        shop,
        product: primaryProduct,
        userId,
        createdAt: daysAgo(index + 1),
        metadata: {
          source: "mock_catalog_product_detail",
          category: primaryProduct.category,
          productStyleTags: primaryProduct.styleTags || [],
          productColors: primaryProduct.colors || [],
        },
      }),
      buildEvent({
        eventType: "tryon_started",
        shop,
        product: primaryProduct,
        userId,
        createdAt: daysAgo(index + 1),
        metadata: {
          taskId: `mock-task-${index + 1}`,
          tryOnType: normalize(primaryProduct.category).includes("dress") ? "dress" : "upper_lower",
          source: "mock_catalog_tryon",
          profile: baseProfile,
          productStyleTags: primaryProduct.styleTags || [],
          productColors: primaryProduct.colors || [],
        },
      }),
      buildEvent({
        eventType: "stylist_product_recommended",
        shop,
        product: secondaryProduct,
        userId,
        createdAt: daysAgo(index + 2),
        metadata: {
          prompt: `Mock request for ${sample.occasion} outfit`,
          occasion: sample.occasion,
          budget: sample.budget,
          profile: baseProfile,
          productStyleTags: secondaryProduct.styleTags || [],
          productColors: secondaryProduct.colors || [],
        },
      }),
      buildEvent({
        eventType: "product_feedback",
        shop,
        product: primaryProduct,
        userId,
        createdAt: daysAgo(index + 3),
        metadata: {
          rating: sample.rating,
          comment: "Mock feedback for dashboard testing.",
          fitFeedback: index % 2 === 0 ? "true_to_size" : "slightly_large",
          context: "mock",
          profile: baseProfile,
          productStyleTags: primaryProduct.styleTags || [],
          productColors: primaryProduct.colors || [],
        },
      })
    );
  });

  return events;
};

const run = async () => {
  const db = await getMongoDb();
  const shopQuery = process.argv[2] || process.env.MOCK_SHOP_QUERY || DEFAULT_SHOP_QUERY;
  const shop = await findShop(db, shopQuery);

  if (!shop) {
    const shops = await db
      .collection("shops")
      .find({}, { projection: { _id: 0, id: 1, slug: 1, name: 1, ownerId: 1 } })
      .limit(10)
      .toArray();
    console.error(`Could not find shop matching "${shopQuery}". Available shops:`);
    console.table(shops);
    process.exitCode = 1;
    return;
  }

  let products = await db
    .collection("products")
    .find({ shopId: shop.id, status: { $ne: "trashed" } })
    .toArray();

  if (!products.length) {
    products = await createFallbackProducts(db, shop);
  }

  await db.collection("shop_events").deleteMany({
    shopId: shop.id,
    "metadata.mockSeed": MOCK_SEED,
  });

  const events = buildMockEvents({ shop, products: products.slice(0, 5) });
  await db.collection("shop_events").insertMany(events);

  console.log(`Seeded ${events.length} mock shop_events for ${shop.name} (${shop.id}).`);
  console.log(`Products used: ${products.slice(0, 5).map((product) => product.id).join(", ")}`);
  console.log("Open Shop Dashboard > Customer Insights with range 30d or 90d.");
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongoConnection();
  });
