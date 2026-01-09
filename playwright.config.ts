import { defineConfig, devices } from "@playwright/test"
import path from "path"

const authFile = path.join(__dirname, "tests/.auth/user.json")

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // 認証セットアップ（最初に実行）
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // 認証不要のテスト
    {
      name: "unauthenticated",
      testMatch: /\.(spec|test)\.ts$/,
      testIgnore: /authenticated\./,
      use: { ...devices["Desktop Chrome"] },
    },
    // 認証が必要なテスト
    {
      name: "authenticated",
      testMatch: /authenticated\./,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
