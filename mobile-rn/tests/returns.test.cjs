const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(request, appendAsset = async () => {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src/api/returns.ts'), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  vm.runInNewContext(code, {exports, FormData, encodeURIComponent, require: () => ({request, appendAsset})});
  return exports.returnsApi;
}
test('return detail decodes backend attachment objects and legacy URL strings', async () => {
  const api = load(async () => ({return: {id: 'r1', attachments: [{imageUrl: 'https://image.test/one.jpg', publicId: 'one'}, 'https://image.test/two.jpg']}}));
  const result = await api.detail('token', 'r1');
  assert.deepEqual(Array.from(result.attachments), ['https://image.test/one.jpg', 'https://image.test/two.jpg']);
});
test('return request preserves item identities and limits multipart proof to three images', async () => {
  let captured; const attachments = [];
  const api = load(async (...args) => {captured = args; return {return: {id: 'r1'}};}, async (_,field,image) => attachments.push({field,image}));
  await api.create('customer-token', 'order/1', {items: [{productId: 'p', variantId: 'v', quantity: 2}], reason: ' Wrong size ', bankName: ' Bank ', accountNumber: ' 123 ', accountHolder: ' Person '}, [1,2,3,4]);
  assert.equal(captured[0], 'POST');
  assert.equal(captured[1], '/orders/returns/me/order%2F1');
  assert.equal(captured[2], 'customer-token');
  assert.deepEqual(JSON.parse(captured[3].get('items')), [{productId: 'p', variantId: 'v', quantity: 2}]);
  assert.equal(captured[3].get('reason'), 'Wrong size');
  assert.equal(captured[3].get('accountNumber'), '123');
  assert.equal(attachments.length, 3);
  assert.ok(attachments.every(a => a.field === 'images'));
});
