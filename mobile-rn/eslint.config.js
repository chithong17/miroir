const {defineConfig} = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  {ignores: ['.qa/**', 'dist/**', 'dist-native/**', 'android/**', 'ios/**', 'test-results/**', 'playwright-report/**']},
]);
