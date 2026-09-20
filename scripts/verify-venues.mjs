import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4178/MM_Wedding_Invitation/";
const venues = [];
for (const day of [1, 2]) {
  const source = await readFile(`day${day}_place.png`);
  const revision = createHash("sha256").update(source).digest("hex").slice(0, 8);
  const metadata = await sharp(source).metadata();
  for (const width of [640, 960, 1440]) {
    const expected = await sharp(source).rotate().resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 }).toBuffer();
    assert.deepEqual(await readFile(`public/assets/photos/day${day}-place-${revision}-${width}.webp`), expected);
  }
  venues.push({ day, revision, ratio: metadata.width / metadata.height });
}
await mkdir("test-results", { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
      await mutedSession(page);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => { if (response.status() >= 400) errors.push(response.url()); });
      await page.goto(url, { waitUntil: "domcontentloaded" });
      for (const { day, revision, ratio } of venues) {
        const figure = page.locator(`#day${day}-info .venue-photo`);
        await figure.evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
        await page.waitForFunction(id => {
          const image = document.querySelector(`#day${id}-info .venue-photo img`);
          return image.complete && image.naturalWidth > 0;
        }, day);
        const actual = await figure.locator("img").evaluate(i => ({
          src: i.currentSrc, width: i.clientWidth, height: i.clientHeight,
          declaredRatio: Number(i.getAttribute("width")) / Number(i.getAttribute("height")),
        }));
        assert.ok(actual.src.includes(`day${day}-place-${revision}-`), actual.src);
        assert.ok(Math.abs(actual.width / actual.height - ratio) < .01, "Preserve full source composition");
        assert.equal(actual.declaredRatio, ratio, "Reserve correct image height before lazy loading");
        const response = await page.request.get(actual.src);
        assert.equal(response.status(), 200);
        assert.deepEqual(await response.body(), await readFile(`public/assets/photos/${actual.src.split("/").pop()}`));
        await page.waitForTimeout(900);
        if (width === 390) await figure.screenshot({ path: `test-results/${engine.name()}-day${day}-venue-current.png` });
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      console.log(`${engine.name()} ${width}: both venue revisions, source bytes, full composition and layout passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
