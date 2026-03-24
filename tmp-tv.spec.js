const { test } = require("playwright/test");

test("inspect tradingview widget", async ({ page }) => {
  page.on("console", (msg) => console.log(`console:${msg.type()}:${msg.text()}`));
  page.on("pageerror", (error) => console.log(`pageerror:${error.message}`));
  page.on("requestfailed", (request) => console.log(`requestfailed:${request.url()}:${request.failure()?.errorText}`));

  await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  const widgetCount = await page.locator("#tv-chart-widget").count();
  const childCount = await page.locator("#tv-chart-widget > *").count();
  const iframeCount = await page.locator("#tv-chart-widget iframe").count();

  console.log(`widgetCount:${widgetCount}`);
  console.log(`childCount:${childCount}`);
  console.log(`iframeCount:${iframeCount}`);
});
