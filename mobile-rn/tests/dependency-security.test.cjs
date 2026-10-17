const test=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const routerRequire=createRequire(require.resolve('expo-router/package.json'));
test('patched query parser retains router query encoding and array behavior',()=>{
  const query=routerRequire('query-string');
  assert.equal(query.parse('q=caf%C3%A9').q,'café');
  assert.equal(query.stringify({q:'a b',page:2}),'page=2&q=a%20b');
  assert.deepEqual([...query.parse('ids=a&ids=b').ids],['a','b']);
  assert.doesNotThrow(()=>query.parse('q='+encodeURIComponent('%E0%A4'.repeat(50))));
});
test('patched UUID dependency retains Xcode project identifier generation',()=>{
  const project=require('xcode').project('qa-only');
  project.hash={project:{objects:{}}};
  assert.match(project.generateUuid(),/^[A-F0-9]{24}$/);
});
