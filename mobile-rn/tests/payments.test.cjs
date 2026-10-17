const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const exportsForTest = {};
const source = fs.readFileSync(path.join(__dirname, '../src/api/payments.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText, {exports: exportsForTest, URL, require: () => ({request: async () => {}})});
test('payment completion requires server paid status', () => {
  assert.equal(exportsForTest.paymentPaid({status: 'PAID'}), true);
  for (const status of ['pending','processing','cancelled','failed']) assert.equal(exportsForTest.paymentPaid({status}), false);
});
test('terminal payment states stop further polling', () => {
  for (const status of ['paid','cancelled','canceled','expired','failed']) assert.equal(exportsForTest.paymentTerminal({status}), true);
  assert.equal(exportsForTest.paymentTerminal({status: 'pending'}), false);
});
test('checkout URLs only accept HTTPS', () => {
  assert.equal(exportsForTest.validCheckoutUrl('https://pay.example.test/checkout/123'), true);
  for (const url of ['javascript:alert(1)', 'file:///tmp/test', 'http://pay.example.test', '', 'not a url']) assert.equal(exportsForTest.validCheckoutUrl(url), false);
});
