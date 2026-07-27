import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  test("home page shows the brand and tagline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Questlog" })).toBeVisible();
    await expect(
      page.getByRole("main").getByText("Archive of played worlds"),
    ).toBeVisible();
  });

  test("nav shows sign in/sign up when logged out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  });

  test("sign in link goes to the login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in to Questlog" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("sign up link goes to the sign-up page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/auth\/sign-up$/);
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: /switch to (dark|light) theme/i });

    await expect(toggle).toBeVisible();
    const initiallyDark = await html.evaluate((el) => el.classList.contains("dark"));

    await toggle.click();
    await expect(html).toHaveClass(initiallyDark ? /^(?!.*dark).*$/ : /dark/);
  });
});

test.describe("protected routes redirect when logged out", () => {
  for (const path of [
    "/library",
    "/library/add",
    "/library/00000000-0000-0000-0000-000000000000",
    "/library/00000000-0000-0000-0000-000000000000/entries/new",
  ]) {
    test(`${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  }
});
