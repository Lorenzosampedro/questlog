import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const TEST_PASSWORD = "test-password-e2e-123!";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for this test. Add it to a " +
        "gitignored .env.test.local — see e2e/README.md.",
    );
  }

  return createClient(url, serviceRoleKey);
}

test.describe("core flow", () => {
  test.setTimeout(60_000);

  let userId: string | undefined;
  let email: string;

  test.beforeAll(async () => {
    const admin = getAdminClient();
    email = `e2e-${Date.now()}@example.com`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (!userId) return;
    const admin = getAdminClient();
    // Cascades to library_games/journal_entries via the FK chain in the
    // schema migration — no separate cleanup needed.
    await admin.auth.admin.deleteUser(userId);
  });

  test("sign in, add a game, write an entry, see it reflected on the shelf", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/library$/);

    await page.getByRole("link", { name: "Add a game" }).click();
    await expect(page).toHaveURL(/\/library\/add$/);
    await page.getByPlaceholder("Search for a game...").fill("Hollow Knight");

    const result = page.getByText("Hollow Knight", { exact: true }).first();
    await expect(result).toBeVisible({ timeout: 10_000 });
    await page
      .getByRole("button", { name: "Add" })
      .first()
      .click();
    await expect(page.getByRole("button", { name: "Added" }).first()).toBeVisible();

    await page.goto("/library");
    await page.getByRole("link", { name: /^Hollow Knight —/ }).click();
    await expect(page.getByRole("heading", { name: "Hollow Knight" })).toBeVisible();

    await page.getByRole("link", { name: "New entry" }).click();
    await page.getByLabel("Title").fill("First impressions");
    await page.locator(".ProseMirror").fill("What a beautiful, moody little world.");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("heading", { name: "First impressions" })).toBeVisible();
    await expect(
      page.getByText("What a beautiful, moody little world."),
    ).toBeVisible();

    await page.goto("/library");
    await expect(
      page.getByRole("link", { name: /^Hollow Knight — 1 entry$/ }),
    ).toBeVisible();
  });
});
