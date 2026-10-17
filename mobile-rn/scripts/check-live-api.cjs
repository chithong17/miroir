// Read-only public API checks. Never creates accounts, orders, AI tasks or payments.
const assert = require('node:assert/strict');
const base = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://miroir-backend-l7si.onrender.com/api').replace(/\/$/, '');
async function get(path) {
  const response = await fetch(base + path, {signal: AbortSignal.timeout(45000)});
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
  const body = await response.json();
  assert.notEqual(body.success, false, `${path}: unsuccessful response`);
  console.log(`PASS GET ${path}`);
  return body;
}
async function main() {
  await get('/health');
  const catalog = await get('/catalog/products?limit=1');
  assert.ok(Array.isArray(catalog.products));
  assert.equal(typeof catalog.pagination.total, 'number');
  if (catalog.products.length) {
    const product = catalog.products[0];
    assert.ok(product.id);
    assert.equal(typeof product.price, 'number');
    assert.ok(Array.isArray(product.variants));
    const detail = await get(`/catalog/products/${encodeURIComponent(product.id)}`);
    assert.equal(detail.product.id, product.id);
    if (product.shopId) {
      const shop = await get(`/catalog/shops/${encodeURIComponent(product.shopId)}`);
      assert.equal(shop.shop.id, product.shopId);
    }
  }
  assert.ok(Array.isArray((await get('/catalog/outfits?limit=1')).outfits));
  assert.ok(Array.isArray((await get('/payments/plans')).plans));
  const {provinces} = await get('/locations/provinces');
  assert.ok(provinces.length);
  const {districts} = await get(`/locations/provinces/${encodeURIComponent(provinces[0].code)}/districts`);
  assert.ok(districts.length);
  const {wards} = await get(`/locations/districts/${encodeURIComponent(districts[0].code)}/wards`);
  assert.ok(wards.length);
  console.log('Public API contracts passed. Authenticated writes/native behavior are NOT covered.');
}
main().catch(error => {console.error(error.message); process.exitCode = 1;});
