const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const moduleExports = {};
const source = fs.readFileSync(path.join(__dirname, '../src/features/owner/productDraft.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText, {exports: moduleExports});
const draft = {id: 'variant-existing', sku: ' blue-m ', color: ' Blue ', size: ' M ', stockQuantity: '12', active: true, costPrice: 100, fitMeasurements: {chest: 92}};
test('editing variants preserves inventory identity and existing fit/cost metadata', () => {
  const [result] = moduleExports.parseVariants([draft]);
  assert.equal(result.id, draft.id);
  assert.equal(result.sku, 'BLUE-M');
  assert.equal(result.stockQuantity, 12);
  assert.equal(result.costPrice, 100);
  assert.equal(result.fitMeasurements.chest, 92);
});
test('duplicate normalized SKUs and invalid inventory are rejected', () => {
  assert.throws(() => moduleExports.parseVariants([draft,{...draft,id:'another',sku:'BLUE-M'}]), /Duplicate/);
  for (const stockQuantity of ['','-1','1.5','NaN']) assert.throws(() => moduleExports.parseVariants([{...draft,stockQuantity}]), /stock/);
});
