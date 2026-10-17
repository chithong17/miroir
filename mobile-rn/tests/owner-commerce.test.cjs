const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(request,appendAsset = async () => {}) {
  const exports = {}; const source = fs.readFileSync(path.join(__dirname,'../src/api/ownerCommerce.ts'),'utf8');
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,FormData,require:() => ({request,appendAsset})});
  return exports;
}
test('owner order transitions expose shipping progression and no final-state actions',() => {
  const {nextOrderStatuses} = load();
  assert.deepEqual(Array.from(nextOrderStatuses.pending_confirmation),['confirmed','cancelled']);
  assert.deepEqual(Array.from(nextOrderStatuses.preparing),['shipping','cancelled']);
  assert.equal(nextOrderStatuses.delivered,undefined);
});
test('refund proof uses images multipart field and the mounted shop return route',async () => {
  let captured; let field;
  const {ownerCommerceApi} = load(async (...args) => {captured=args;},async (_,name) => {field=name;});
  await ownerCommerceApi.refund('owner-token','r/1',' done ',{});
  assert.equal(captured[1],'/shop-orders/returns/r%2F1/refund');
  assert.equal(captured[2],'owner-token');
  assert.equal(captured[3].get('note'),'done');
  assert.equal(field,'images');
});
test('cancelled order refunds use the payment action and single image field',async () => {
  let captured;let field;
  const {ownerCommerceApi}=load(async (...args) => {captured=args;},async (_,name) => {field=name;});
  await ownerCommerceApi.payment('owner-token','order1','mark_refunded',' returned ',{});
  assert.equal(captured[1],'/shop-orders/order1/payment');assert.equal(captured[3].get('action'),'mark_refunded');assert.equal(captured[3].get('reason'),'returned');assert.equal(field,'image');
});
