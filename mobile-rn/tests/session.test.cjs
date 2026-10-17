const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');const path = require('node:path');const vm = require('node:vm');const ts = require('typescript');
function load(me = async () => ({id:'u1'})) {
  const data = new Map();const handlers = [];let state;
  class ApiError extends Error {get unauthorized(){return false;}}
  class QueryClient {clear(){} }
  const source = fs.readFileSync(path.join(__dirname,'../src/stores/session.ts'),'utf8');const exports = {};
  const storage = {getItem:async key => data.get(key) || null,setItem:async (key,value) => data.set(key,value)};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name => {
    if (name.includes('async-storage')) return {__esModule:true,default:storage};
    if (name === 'expo-secure-store') return {};
    if (name === 'react-native') return {Platform:{OS:'web'}};
    if (name === 'zustand') return {create:init => {const store = () => state;store.getState = () => state;state = init(update => {state={...state,...update};},() => state);return store;}};
    if (name.includes('react-query')) return {QueryClient};
    if (name.includes('/customer')) return {customerApi:{me}};
    if (name.includes('/contracts')) return {ApiError};
    if (name.includes('/authEvents')) return {onUnauthorized:fn => handlers.push(fn)};
    throw new Error(name);
  }});
  return exports.useSession;
}
test('late profile refresh and profile mutation do not revive a logged-out customer',async () => {
  let resolve;const session=load(() => new Promise(done => {resolve=done;}));
  await session.getState().authenticate({token:'t1',user:{id:'u1'}});
  const refresh=session.getState().refresh();await session.getState().logout();resolve({id:'u1',name:'late'});await refresh;
  session.getState().setUser({id:'u1',name:'late mutation'});
  assert.equal(session.getState().token,'');assert.equal(session.getState().user,null);
});
test('a stale unauthorized response cannot expire a replacement token',async () => {
  const session=load();await session.getState().authenticate({token:'t2',user:{id:'u2'}});
  await session.getState().expire('t1');assert.equal(session.getState().token,'t2');
  await session.getState().expire('t2');assert.equal(session.getState().token,'');assert.equal(session.getState().guest,false);
});
test('deleteAccount clears session token and switches to guest',async () => {
  const session=load();await session.getState().authenticate({token:'t3',user:{id:'u3'}});
  await session.getState().deleteAccount();
  assert.equal(session.getState().token,'');assert.equal(session.getState().user,null);assert.equal(session.getState().guest,true);
});
