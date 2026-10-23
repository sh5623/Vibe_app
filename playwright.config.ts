import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // vitest 기본 include(*.test.* / *.spec.*)와 겹치지 않게 .e2e.ts 만 잡는다
  testMatch: '**/*.e2e.ts',
  use: {
    baseURL: 'http://localhost:5179',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev --port 5179',
    url: 'http://localhost:5179',
    reuseExistingServer: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
