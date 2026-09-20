import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const site = process.env.EXPECTED_SITE_URL || "https://moreda313.github.io/MM_Wedding_Invitation/";
const asset = "assets/share/cover-7e23e22c.jpg";
const localImage = await readFile(`public/${asset}`);
const expectedImage = await sharp(await readFile("cover.png")).rotate()
  .resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
assert.deepEqual(localImage, expectedImage, "Share cover must derive from the supplied original");
const info = await sharp(localImage).metadata();
assert.equal(info.width, 1200);
assert.equal(info.height, 630);
assert.ok(!info.exif && !info.xmp);
assert.ok(localImage.length < 300 * 1024);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  const response = await page.goto(url, { waitUntil: "networkidle" });
  const html = await response.text();
  assert.ok(!html.includes("__PUBLIC_SITE_URL__"), "Metadata is resolved at build time");
  const meta = key => page.locator(`meta[property="${key}"]`).getAttribute("content");
  assert.equal(await meta("og:title"), "毛凌涛 & 陈婉梦的婚礼请柬");
  assert.match(await meta("og:description"), /2026\.10\.22 建德 · 10\.23 遂昌/);
  assert.equal(await meta("og:type"), "website");
  assert.equal(await meta("og:url"), site);
  assert.equal(await meta("og:image"), `${site}${asset}`);
  assert.equal(await meta("og:image:type"), "image/jpeg");
  assert.equal(await meta("og:image:width"), "1200");
  assert.equal(await meta("og:image:height"), "630");
  assert.ok(await meta("og:image:alt"));
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), site);
  assert.equal(await page.locator('meta[name="twitter:image"]').getAttribute("content"), `${site}${asset}`);
  const cover = await page.request.get(new URL(asset, url).href);
  assert.equal(cover.status(), 200);
  assert.match(cover.headers()["content-type"], /image\/jpeg/);
  assert.deepEqual(await cover.body(), localImage);
  await page.close();

  const app = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const covers = [];
  app.on("request", request => { if (request.url().includes("/assets/share/")) covers.push(request.url()); });
  await app.goto(url, { waitUntil: "networkidle" });
  assert.equal(await app.locator('body img[src*="cover-"]').count(), 0);
  assert.equal(covers.length, 0, "Share-only artwork must not cost bandwidth in the invitation");
  assert.equal(await app.locator(".invitation").getAttribute("data-audio-status"), "off");
  console.log("Share metadata passed without JavaScript; full-composition JPEG loads correctly, has no EXIF and never appears or loads in the invitation");
} finally { await browser.close(); }
