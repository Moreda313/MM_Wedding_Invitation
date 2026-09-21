import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const ids = ["01", "02", "03", "04", "15", "16", "18", "19", "22", "24", "25"];
assert.deepEqual((await readdir("public/assets/photos/wall")).sort(), ids.map(id => `wall-${id}.webp`));
for (const id of ids) {
  const metadata = await sharp(`public/assets/photos/wall/wall-${id}.webp`).metadata();
  assert.ok(!metadata.exif && !metadata.xmp, "No EXIF or GPS in published photos");
}
// Confirm all three new venue assets match the actual attached source, not a stale file.
const source = await readFile("day2_place.png");
const revision = createHash("sha256").update(source).digest("hex").slice(0, 8);
for (const width of [640, 960, 1440]) {
  const expected = await sharp(source).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 88, effort: 6 }).toBuffer();
  assert.deepEqual(await readFile(`public/assets/photos/day2-place-${revision}-${width}.webp`), expected);
}
await mkdir("test-results", { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, deviceScaleFactor: 2 });
      await mutedSession(page);
      const errors = [], wallRequests = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      page.on("request", r => { if (r.url().includes("/photos/wall/")) wallRequests.push(r.url()); });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForFunction(() => [...document.querySelectorAll("#memory-wall img")].every(i => i.complete && i.naturalWidth > 0));
      assert.equal(wallRequests.length, 11, "After the initial page loads, upcoming photos warm in the background");
      assert.equal(await page.locator(".photo-story, .photo-space").count(), 0);
      assert.deepEqual(await page.locator(".snapshot").evaluateAll(items => items.map(e => e.dataset.photo)), ids);
      assert.ok(await page.locator("#memory-wall").evaluate(e => e.previousElementSibling.classList.contains("day-two") && e.nextElementSibling.id === "ending"));
      assert.equal(await page.locator("main > :last-child").getAttribute("id"), "info-summary");
      await page.locator("#day2-info .venue-photo").evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
      await page.waitForFunction(() => { const i = document.querySelector("#day2-info .venue-photo img"); return i.complete && i.naturalWidth > 0; });
      const venue = await page.locator("#day2-info .venue-photo img").evaluate(i => ({ src: i.currentSrc, width: i.clientWidth, height: i.clientHeight }));
      assert.ok(venue.src.includes(`day2-place-${revision}-`));
      assert.ok(Math.abs(venue.width / venue.height - 4 / 3) < .01);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/${engine.name()}-${width}-updated-day2.png` });
      await page.locator("#memory-wall").evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
      await page.waitForFunction(() => [...document.querySelectorAll("#memory-wall img")].every(i => i.complete && i.naturalWidth > 0));
      await page.waitForTimeout(300);
      assert.equal(wallRequests.length, 11);
      assert.equal(await page.locator(".invitation").getAttribute("data-scene"), "party");
      assert.equal(await page.locator("#wall-title").innerText(), "下一张，和你一起。");
      assert.equal(await page.locator(".wall-message").innerText(), "把这次相聚，也留在照片里。");
      const wall = await page.locator(".wall-board").boundingBox();
      if (width < 700) assert.ok(wall.height < 365);
      if (width === 390) assert.ok(Math.abs(wall.height - 280) < 2, "Keep approved phone preview size");
      for (const id of ["16", "18"]) assert.equal(await page.locator(`[data-photo="${id}"] img`).evaluate(e => getComputedStyle(e).aspectRatio.replaceAll(" ", "")), "4/5");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `test-results/${engine.name()}-${width}-integrated-wall.png` });
      await page.locator(".memory-wall").screenshot({ path: `test-results/${engine.name()}-${width}-wall-detail.png` });
      await page.goto(`${url}#memory-wall`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.querySelector(".invitation").dataset.scene === "party");
      assert.deepEqual(errors, []);
      console.log(`${engine.name()} ${width}: approved wall, eleven prefetched photos, last-page summary and current venue passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
