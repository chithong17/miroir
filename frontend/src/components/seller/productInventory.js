export const getProductStock = (product) => {
  if (Array.isArray(product?.variants)) {
    return product.variants.reduce((total, variant) => {
      if (variant?.active === false) return total;

      const quantity = Number(variant?.stockQuantity);
      return total + (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
    }, 0);
  }

  const legacyStock = Number(product?.stock);
  return Number.isFinite(legacyStock) ? Math.max(0, legacyStock) : 0;
};

export const isProductOutOfStock = (product) => getProductStock(product) === 0;
