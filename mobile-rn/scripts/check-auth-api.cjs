// Credentials come from the process environment only. Do not log response bodies or tokens.
const assert = require('node:assert/strict');
const base = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://miroir-backend-l7si.onrender.com/api').replace(/\/$/, '');
async function call(path, token, data, allowedStatus = 200) {
  const response = await fetch(base + path, {
    method: data ? 'POST' : 'GET', signal: AbortSignal.timeout(45000),
    headers: {...(token ? {Authorization:`Bearer ${token}`} : {}), ...(data ? {'Content-Type':'application/json'} : {})},
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await response.json();
  if (response.status === allowedStatus && allowedStatus !== 200) {
    console.log(`GATED ${response.status} GET ${path}`);
    return body;
  }
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}, code=${body.code || 'none'}`);
  assert.notEqual(body.success, false, `${path}: unsuccessful`);
  console.log(`PASS ${data ? 'POST' : 'GET'} ${path}`);
  return body;
}
async function main() {
  for (const actor of ['CUSTOMER', 'SHOP']) {
    assert.ok(process.env[`MIROIR_${actor}_EMAIL`] && process.env[`MIROIR_${actor}_PASSWORD`], `Missing ${actor} credentials`);
  }
  const customer = await call('/user-auth/login', '', {email:process.env.MIROIR_CUSTOMER_EMAIL,password:process.env.MIROIR_CUSTOMER_PASSWORD});
  assert.ok(customer.token && customer.user?.id);
  console.log(`Customer saved model photo: ${Boolean(customer.user.profile?.modelImageUrl)}`);
  const token = customer.token;
  assert.equal((await call('/user-auth/me', token)).user.id, customer.user.id);
  for (const [path, field] of [
    ['/users/me/favorites','products'], ['/users/me/addresses','addresses'], ['/orders/me','orders'],
    ['/orders/returns/me','returns'], ['/chat/conversations','conversations'],
  ]) assert.ok(Array.isArray((await call(path, token))[field]), `${path}: missing ${field}`);
  const cart = (await call('/users/me/cart', token)).cart;
  assert.ok(Array.isArray(cart.groups));
  // Customer billing does not exist: payment middleware accepts shop-owner tokens only.
  const shop = await call('/shop-auth/login', '', {email:process.env.MIROIR_SHOP_EMAIL,password:process.env.MIROIR_SHOP_PASSWORD});
  assert.ok(shop.token && shop.owner?.id);
  console.log(`Shop entitlement: ${shop.owner.subscription?.isPremium ? 'premium' : 'not premium'}`);
  const ownerToken = shop.token;
  for (const [path, field] of [
    ['/shops/me','shops'], ['/shop-products','products'], ['/shop-orders','orders'],
    ['/shop-orders/returns','returns'], ['/shop-chat/conversations','conversations'],
  ]) assert.ok(Array.isArray((await call(path, ownerToken))[field]), `${path}: missing ${field}`);
  const billing = await call('/payments/me', ownerToken);
  console.log(`Shop trial eligible: ${Boolean(billing.subscription?.trialEligible)}; plan: ${billing.subscription?.planCode || 'none'}`);
  await call('/payments/invoices', ownerToken);
  const plan = (await call('/payments/plans')).plans.find(p => p.accountType === 'shop_owner');
  if (plan) await call(`/payments/quote/${encodeURIComponent(plan.code)}`, ownerToken);
  for (const name of ['dashboard','analytics','insights']) {
    const body = await call(`/shops/me/${name}?range=30d`, ownerToken, undefined, billing.subscription?.isPremium ? 200 : 403);
    if (billing.subscription?.isPremium) assert.ok(body[name]);
  }
  console.log('Authenticated read checks passed. No order/product/payment mutations performed.');
}
main().catch(error => {console.error(error.message); process.exitCode = 1;});
