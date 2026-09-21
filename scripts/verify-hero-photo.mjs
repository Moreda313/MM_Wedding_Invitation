import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
await mkdir("test-results/hero-photo", { recursive: true });
const geometry = photo => photo.evaluate(e => {
  const image = e.getBoundingClientRect(), stage = e.parentElement.getBoundingClientRect();
  return { width: image.width, height: image.height, left: image.left - stage.left,
    top: image.top - stage.top, stageWidth: stage.width, stageHeight: stage.height };
});
function assertFullPhoto(box) {
  assert.ok(box.width > 0 && box.height > 0, "Reserve the photo size before loading");
  assert.ok(Math.abs(box.width / box.height - 2 / 3) < .001, "Keep original 2:3 framing, never crop or stretch");
  assert.ok(box.left >= -.1 && box.top >= -.1);
  assert.ok(box.left + box.width <= box.stageWidth + .1 && box.top + box.height <= box.stageHeight + .1);
}

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [740, 900], [1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: true, deviceScaleFactor: 3 });
      await mutedSession(page);
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      let requests = 0;
      await page.route("**/couple-*.webp", async route => {
        requests++;
        await gate;
        await route.continue();
      });
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const photo = page.locator(".couple-photo");
      await page.waitForTimeout(250);
      assert.ok(requests > 0, "Start fetching the hero during the quiet greeting, not on first scroll");
      const unloaded = await geometry(photo);
      assertFullPhoto(unloaded);
      await page.locator("#day1").evaluate(e => scrollTo({ top: e.offsetTop, behavior: "instant" }));
      assert.deepEqual(await geometry(photo), unloaded);
      // Simulate a slow connection while the image is already in view.
      await page.waitForTimeout(400);
      release();
      await page.waitForFunction(() => {
        const e = document.querySelector(".couple-photo");
        return e.complete && e.naturalWidth > 0;
      });
      await page.waitForTimeout(200);
      assert.deepEqual(await geometry(photo), unloaded, "Decoded image must not change its reserved frame");
      for (const delta of [24, -12, 100, -112]) {
        await page.evaluate(y => scrollBy({ top: y, behavior: "instant" }), delta);
        await page.waitForTimeout(80);
        assert.deepEqual(await geometry(photo), unloaded, "Scrolling must not change framing");
      }
      if (width === 390) {
        await page.screenshot({ path: `test-results/hero-photo/${engine.name()}-390.png` });
        // Model viewport changes separately: the image may resize but stays whole.
        for (const viewport of [{ width, height: 740 }, { width: 844, height: 390 }, { width, height }]) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(150);
          assertFullPhoto(await geometry(photo));
        }
      }
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.querySelector(".couple-photo")?.naturalWidth > 0);
      assertFullPhoto(await geometry(photo));
      assert.deepEqual(errors, []);
      console.log(`${engine.name()} ${width}: delayed load, reserved frame, full composition, scroll, reload passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
