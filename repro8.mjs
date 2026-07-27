import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto("http://localhost:3000/dev-media-repro", { waitUntil: "networkidle" });
await page.click("#run");
await page.waitForTimeout(1500);

console.log(await page.locator("#result").innerText());

await browser.close();
