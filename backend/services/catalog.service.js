import { getMongoDb } from "./mongo.service.js";
import { toPublicProduct } from "./product.service.js";
import { getPremiumShopIds } from "./subscription.service.js";

const cleanString = (value) => String(value || "").trim();

const pageParams = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || "12", 10), 1), 48);
  return { page, limit, skip: (page - 1) * limit };
};

const publicShop = (shop) => ({
  id: shop.id,
  name: shop.name,
  displayName: shop.name,
  slug: shop.slug,
  description: shop.description || "",
  logoUrl: shop.logoUrl || "",
  coverUrl: shop.coverUrl || "",
  contact: {
    address: shop.contact?.address || "",
    email: shop.contact?.email || "",
    phone: shop.contact?.phone || "",
  },
});

const withShopInfo = (products, shops) => {
  const shopById = new Map(shops.map((shop) => [shop.id, publicShop(shop)]));
  return products.map((product) => ({
    ...toPublicProduct(product),
    shop: shopById.get(product.shopId) || null,
  }));
};

export const listCatalogProducts = async (query = {}) => {
  const db = await getMongoDb();
  const { page, limit, skip } = pageParams(query);
  const activeShops = await db.collection("shops").find({ status: "active" }).toArray();
  const activeShopIds = [...await getPremiumShopIds(activeShops.map((shop) => shop.id))];
  const filter = {
    shopId: { $in: activeShopIds },
    status: "published",
    availability: "in_stock",
    variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
  };
  const search = cleanString(query.search);

  if (query.shopId) {
    filter.shopId = activeShopIds.includes(query.shopId) ? query.shopId : "__missing_active_shop__";
  }
  if (query.category) filter.category = query.category;
  if (query.gender) filter.gender = { $in: [query.gender, "unisex"] };

  const price = {};
  if (Number.isFinite(Number(query.minPrice))) price.$gte = Number(query.minPrice);
  if (Number.isFinite(Number(query.maxPrice))) price.$lte = Number(query.maxPrice);
  if (Object.keys(price).length) filter.price = price;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { styleTags: { $regex: search, $options: "i" } },
    ];
  }

  const [total, products] = await Promise.all([
    db.collection("products").countDocuments(filter),
    db
      .collection("products")
      .aggregate([
        { $match: filter },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray(),
  ]);

  return {
    products: withShopInfo(products, activeShops),
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
};

export const listCatalogOutfits = async (query = {}) => {
  const db = await getMongoDb();
  const { page, limit, skip } = pageParams(query);
  const search = cleanString(query.search);
  const outfitFilter = {};

  if (query.gender) outfitFilter.gender = { $in: [query.gender, "unisex"] };
  if (search) {
    outfitFilter.$or = [
      { title: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { styleTags: { $regex: search, $options: "i" } },
    ];
  }

  const [total, outfits] = await Promise.all([
    db.collection("outfits").countDocuments(outfitFilter),
    db.collection("outfits").find(outfitFilter).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
  ]);
  const productIds = [
    ...new Set(
      outfits
        .flatMap((outfit) => outfit.productIds || outfit.products || [])
        .map((item) => (typeof item === "string" ? item : item.productId || item.id))
        .filter(Boolean)
    ),
  ];
  const products = productIds.length
    ? await db.collection("products").find({ id: { $in: productIds }, status: "published", variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } } }).toArray()
    : [];
  const shopIds = [...new Set(products.map((product) => product.shopId).filter(Boolean))];
  const activePaidShopIds = await getPremiumShopIds(shopIds);
  const shops = shopIds.length
    ? await db.collection("shops").find({ id: { $in: shopIds }, status: "active" }).toArray()
    : [];
  const sellableProducts = products.filter((product) => activePaidShopIds.has(product.shopId));
  const productById = new Map(withShopInfo(sellableProducts, shops).map((product) => [product.id, product]));

  return {
    outfits: outfits.map((outfit) => ({
      id: outfit.id,
      title: outfit.title || outfit.name || "Outfit",
      description: outfit.description || "",
      imageUrl: outfit.imageUrl || "",
      gender: outfit.gender || "",
      styleTags: outfit.styleTags || [],
      products: (outfit.productIds || outfit.products || [])
        .map((item) => productById.get(typeof item === "string" ? item : item.productId || item.id))
        .filter(Boolean),
    })),
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
};

export const getCatalogShop = async (shopId) => {
  const db = await getMongoDb();
  const shop = await db.collection("shops").findOne({ id: shopId, status: "active" });
  if (!shop) {
    const error = new Error("Shop was not found.");
    error.statusCode = 404;
    throw error;
  }
  const activeIds = await getPremiumShopIds([shop.id]);
  if (!activeIds.has(shop.id)) {
    const error = new Error("Shop subscription is inactive.");
    error.statusCode = 404;
    throw error;
  }
  return publicShop(shop);
};

export const getCatalogProduct = async (productId) => {
  const db = await getMongoDb();
  const product = await db.collection("products").findOne({
    id: productId,
    status: "published",
    availability: "in_stock",
    variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
  });
  if (!product) {
    const error = new Error("Product was not found.");
    error.statusCode = 404;
    throw error;
  }
  const shop = await db.collection("shops").findOne({ id: product.shopId, status: "active" });
  if (!shop) {
    const error = new Error("Shop was not found.");
    error.statusCode = 404;
    throw error;
  }
  const activeIds = await getPremiumShopIds([shop.id]);
  if (!activeIds.has(shop.id)) {
    const error = new Error("Shop subscription is inactive.");
    error.statusCode = 404;
    throw error;
  }
  return { product, shop };
};
