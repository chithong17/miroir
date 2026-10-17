const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(request = async () => ({})) {
  const source = fs.readFileSync(path.join(__dirname, '../src/api/chat.ts'), 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText, {exports, FormData, require: () => ({request, appendAsset: async () => {}})});
  return exports;
}
test('overlapping message pages deduplicate and display in chronological order', () => {
  const {mergeMessages} = load();
  const a = {id: 'a', createdAt: '2026-01-01T00:00:00Z'}; const b = {id: 'b', createdAt: '2026-01-02T00:00:00Z'};
  assert.deepEqual(Array.from(mergeMessages([[b,a],[a]]), m => m.id), ['a','b']);
});
test('chat multipart preserves retry identity and product context', async () => {
  let captured;
  const {chatApi} = load(async (...args) => {captured = args; return {message: {id: 'm1'}};});
  await chatApi.send('user', 'token', 'conversation/1', 'retry-1', ' hello ', [], {type: 'product', id: 'p1'});
  assert.equal(captured[1], '/chat/conversations/conversation%2F1/messages');
  assert.equal(captured[3].get('clientMessageId'), 'retry-1');
  assert.equal(captured[3].get('text'), 'hello');
  assert.equal(captured[3].get('contextType'), 'product');
  assert.equal(captured[3].get('contextId'), 'p1');
});
test('shop conversations use owner endpoints and token without customer routing', async () => {
  const calls = [];
  const {chatApi} = load(async (...args) => {calls.push(args); return {conversation:{id:'c1'},messages:[]};});
  await chatApi.open('shop','owner-token',{orderId:'order-1'});
  await chatApi.messages('shop','owner-token','c1','older-cursor');
  await chatApi.read('shop','owner-token','c1');
  assert.equal(calls[0][1],'/shop-chat/conversations');
  assert.equal(calls[1][1],'/shop-chat/conversations/c1/messages');
  assert.equal(calls[1][4].before,'older-cursor');
  assert.equal(calls[2][1],'/shop-chat/conversations/c1/read');
  assert.ok(calls.every(call => call[2] === 'owner-token'));
});
