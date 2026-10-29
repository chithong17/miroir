const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const errors = [];
const warnings = [];
const production = eas.build?.production?.env || {};

function requireValue(value, label) {
  if (!value) errors.push(`${label} is missing.`);
}
function requireHttps(value, label) {
  requireValue(value, label);
  if (value && !/^https:\/\//i.test(value)) errors.push(`${label} must use HTTPS.`);
  if (value && /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(value)) errors.push(`${label} points to a development machine.`);
}

requireValue(app.ios?.bundleIdentifier, 'iOS bundle identifier');
requireValue(app.ios?.buildNumber, 'iOS build number');
if (Number(app.ios?.buildNumber) <= 6) errors.push('iOS build number must be greater than rejected build 6.');
if (app.ios?.supportsTablet !== true) errors.push('iPad support must remain enabled for this listing.');
if (app.ios?.infoPlist?.ITSAppUsesNonExemptEncryption !== false) warnings.push('Export-compliance declaration is not explicitly set to false.');
requireHttps(production.EXPO_PUBLIC_API_BASE_URL, 'Production API URL');
requireHttps(production.EXPO_PUBLIC_SOCKET_URL, 'Production socket URL');
if (!app.extra?.eas?.projectId) warnings.push('EAS project ID is not configured yet; run EAS project initialization with the correct Expo account before cloud build.');

console.log(`MIROIR ${app.version} (${app.ios?.buildNumber || '?'}) — ${app.ios?.bundleIdentifier || '?'}`);
for (const message of warnings) console.warn(`WARNING: ${message}`);
if (errors.length) {
  for (const message of errors) console.error(`ERROR: ${message}`);
  process.exitCode = 1;
} else {
  console.log('Release configuration checks passed. Native device QA and signing are still required.');
}
