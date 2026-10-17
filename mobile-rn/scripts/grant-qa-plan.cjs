// Explicitly authorized migration QA action. No webhook/payment-provider simulation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const backend = path.resolve(__dirname, '../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({path:path.join(backend,'.env'), quiet:true});
const {BSON} = require(path.join(backend,'node_modules/mongodb'));
const load = name => import(pathToFileURL(path.join(backend, 'services', name)).href);
async function main() {
  assert.equal(process.env.MIROIR_ALLOW_QA_GRANT, 'yes', 'Explicit MIROIR_ALLOW_QA_GRANT=yes required');
  assert.ok(process.env.MIROIR_SHOP_EMAIL && process.env.MIROIR_SHOP_PASSWORD);
  const response = await fetch('https://miroir-backend-l7si.onrender.com/api/shop-auth/login', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:process.env.MIROIR_SHOP_EMAIL,password:process.env.MIROIR_SHOP_PASSWORD}),
    signal:AbortSignal.timeout(45000),
  });
  assert.equal(response.status,200);
  const live = await response.json();
  const {getMongoDb, closeMongoConnection} = await load('mongo.service.js');
  try {
    const db = await getMongoDb();
    const owner = await db.collection('shop_owners').findOne({id:live.owner.id,email:process.env.MIROIR_SHOP_EMAIL.toLowerCase()});
    assert.ok(owner && owner.status === 'active', 'DB target does not match live owner');
    if (owner.subscription?.status === 'active' && new Date(owner.subscription.expiresAt) > new Date()) {
      console.log('Active subscription already exists; no grant applied.');return;
    }
    const pending=await db.collection('payment_orders').find({accountId:owner.id,status:'pending'},{projection:{id:1,orderCode:1,createdAt:1,status:1,amount:1}}).toArray();
    for(const order of pending) {
      if(process.env.MIROIR_CANCEL_PENDING_FOR_GRANT === 'yes') {
        const output=path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
        const before=path.join(output,`checkout-before-${order.orderCode}.json`);
        if(!fs.existsSync(before)) fs.writeFileSync(before,BSON.EJSON.stringify({ownerId:owner.id,order,capturedAt:new Date()},null,2),{flag:'wx'});
        const {PayOS}=require(path.join(backend,'node_modules/@payos/node'));
        const payos=new PayOS({clientId:process.env.PAYOS_CLIENT_ID,apiKey:process.env.PAYOS_API_KEY,checksumKey:process.env.PAYOS_CHECKSUM_KEY});
        const provider=await payos.paymentRequests.get(Number(order.orderCode));
        console.log(`Existing checkout provider state: ${provider.status}`);
        assert.notEqual(provider.status,'PAID','Do not cancel a paid checkout');
        if(provider.status==='PENDING') await payos.paymentRequests.cancel(Number(order.orderCode),'User-authorized QA admin grant replaces unpaid checkout');
      }
      const statusResponse=await fetch(`https://miroir-backend-l7si.onrender.com/api/payments/status/${encodeURIComponent(order.orderCode)}`,{signal:AbortSignal.timeout(45000)});
      const statusBody=await statusResponse.json();
      assert.ok(statusResponse.ok,'Unable to sync existing checkout');
      console.log(`Existing checkout synced: ${statusBody.order?.status || 'unknown'}`);
    }
    assert.equal(await db.collection('payment_orders').countDocuments({accountId:owner.id,status:'pending'}),0,'Existing pending checkout must be resolved first');
    assert.equal(await db.collection('billing_entries').countDocuments({ownerId:owner.id,invoiceId:null,amount:{$gt:0}}),0,'Uninvoiced charges exist; refusing to issue invoices as a side effect');
    assert.ok(!owner.subscription?.pendingRenewal,'Existing renewal must not be changed');
    const snapshot = {
      capturedAt:new Date(), ownerId:owner.id, subscription:owner.subscription || null,
      cycle:owner.subscription?.cycleId ? await db.collection('billing_cycles').findOne({id:owner.subscription.cycleId}) : null,
      purpose:'User-authorized React Native migration QA; zero-cost GROWTH admin grant',
    };
    const output = path.resolve(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
    fs.writeFileSync(path.join(output,'shop-grant-before.json'),BSON.EJSON.stringify(snapshot,null,2),{flag:'wx'});
    const {grantShopPlan} = await load('planGrant.service.js');
    const result = await grantShopPlan({ownerId:owner.id,planCode:'GROWTH',grantType:'admin_grant',grantedBy:'migration-qa-user-authorized'});
    fs.writeFileSync(path.join(output,'shop-grant-result.json'),BSON.EJSON.stringify(result,null,2));
    console.log(`Granted zero-cost GROWTH via admin_grant; expires ${new Date(result.expiresAt).toISOString()}. No money moved.`);
  } finally {await closeMongoConnection();}
}
main().catch(error => {console.error(error.name + ': ' + error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g,'[redacted]'));process.exitCode=1;});
