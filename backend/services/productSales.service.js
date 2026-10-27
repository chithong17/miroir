// Catalog allocations are kept separate from payment and order history.
export const withProductSoldCounts = async (db, products = []) => {
  const productIds = [...new Set(products.map((product) => product.id).filter(Boolean))];
  if (!productIds.length) return products;

  const [orders, allocations] = await Promise.all([
    db.collection("orders").aggregate([
      { $match: { orderStatus: "delivered", paymentStatus: "paid", mockSeed: { $exists: false }, "items.productId": { $in: productIds } } },
      { $unwind: "$items" },
      { $match: { "items.productId": { $in: productIds } } },
      { $group: { _id: "$items.productId", quantity: { $sum: "$items.quantity" } } },
    ]).toArray(),
    db.collection("catalog_sales").aggregate([
      { $match: { productId: { $in: productIds } } },
      { $group: { _id: "$productId", quantity: { $sum: "$quantity" } } },
    ]).toArray(),
  ]);
  const counts = new Map();
  for (const row of [...orders, ...allocations]) {
    counts.set(row._id, (counts.get(row._id) || 0) + Math.max(0, Number(row.quantity) || 0));
  }
  return products.map((product) => ({ ...product, soldCount: counts.get(product.id) || 0 }));
};
