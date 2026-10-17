const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual store without loading React Native's platform runtime.
function load(request) {
  const source = fs.readFileSync(path.join(__dirname, '../src/features/try-on/state.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  const exports = {};
  const session = {token: 'customer-token', refresh: async () => {}};
  const create = init => {
    let state;
    const store = () => state;
    store.getState = () => state;
    state = init(update => {state = {...state, ...update};}, () => state);
    return store;
  };
  vm.runInNewContext(compiled, {exports, FormData, require: name => {
    if (name === 'zustand') return {create};
    if (name.includes('/client')) return {request, appendAsset: async () => {}};
    if (name.includes('/session')) return {useSession: {getState: () => session}};
    throw new Error(`Unexpected runtime dependency: ${name}`);
  }});
  return exports;
}
const photo = {uri: 'file:///photo.jpg', name: 'photo.jpg', mimeType: 'image/jpeg'};

test('custom and catalog selections enforce required images', () => {
  const {validateTryOn} = load();
  assert.match(validateTryOn('dress', {}, null), /full-body/);
  assert.match(validateTryOn('dress', {model: photo}, null), /dress image/);
  assert.match(validateTryOn('upper_lower', {model: photo}, null), /at least one/);
  assert.equal(validateTryOn('upper_lower', {model: photo, upper: photo}, null), '');
  assert.equal(validateTryOn('dress', {model: photo}, {id: 'p1'}), '');
});

test('reset ignores a late task creation response', async () => {
  let resolve;
  const {useTryOn} = load(() => new Promise(done => {resolve = done;}));
  useTryOn.getState().setImage('model', photo);
  useTryOn.getState().setImage('dress', photo);
  const pending = useTryOn.getState().submit();
  await new Promise(done => setImmediate(done));
  useTryOn.getState().reset();
  resolve({success: true, taskId: 'late-task'});
  await pending;
  assert.equal(useTryOn.getState().taskId, '');
  assert.equal(useTryOn.getState().status, 'idle');
});

test('polling records completed result and unread completion', async () => {
  const {useTryOn} = load(async method => method === 'POST' ? {success: true, taskId: 'task-1'} : {success: true, status: 'completed', resultUrl: 'https://example.test/result.jpg'});
  useTryOn.getState().setImage('model', photo);
  useTryOn.getState().setImage('dress', photo);
  await useTryOn.getState().submit();
  await new Promise(done => setImmediate(done));
  assert.equal(useTryOn.getState().status, 'completed');
  assert.equal(useTryOn.getState().unread, true);
  assert.equal(useTryOn.getState().resultUrl, 'https://example.test/result.jpg');
});
