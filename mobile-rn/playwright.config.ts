import { defineConfig } from '@playwright/test';
export default defineConfig({
  testMatch: process.env.MIROIR_LIVE_API ? '**/live.spec.ts' : '**/smoke.spec.ts',
  outputDir: process.env.MIROIR_LIVE_API ? 'test-results/live' : 'test-results/smoke',
  testDir: './e2e', timeout: 60000, fullyParallel: false, workers: 1,
  use: {baseURL: 'http://127.0.0.1:8089', channel: 'msedge', viewport: {width: 390,height:844}, trace: process.env.MIROIR_LIVE_API ? 'off' : 'retain-on-failure', screenshot: 'only-on-failure'},
  webServer: {command: 'npx expo start --web --localhost --port 8089', url: 'http://127.0.0.1:8089', timeout: 120000, reuseExistingServer: false, env: {CI:'1', EXPO_OFFLINE:'1', EXPO_PUBLIC_API_BASE_URL:process.env.MIROIR_LIVE_API || 'http://localhost:5000/api'}},
});
