import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// .env.local has the public Supabase/RAWG config; .env.test.local (gitignored,
// not created by default) holds SUPABASE_SERVICE_ROLE_KEY for the
// authenticated core-flow test — see e2e/README.md.
config({ path: ".env.local", quiet: true });
config({ path: ".env.test.local", override: true, quiet: true });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
