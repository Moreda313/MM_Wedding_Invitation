import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const asset = "assets/share/wedding-cover-976137ba.jpg";
await mkdir("test-results/summary-cover", { recursive: true });
const geometry = page => page.locator("#info-summary").evaluate(e => {
  const parent = e.getBoundingClientRect();
  return Object.fromEntries([".summary-cover", ".summary-heading", ".summary-days"].map(selector => {
    const rect = e.querySelector(selector).getBoundingClientRect();
    return [selector, { x: rect.left - parent.left, y: rect.top - parent.top, width: rect.width, height: rect.height }];
  }));
});

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const [width, height] of [[320, 568], [390, 844], [1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
      await mutedSession(page);
      const errors = [], requests = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      page.on("request", request => { if (request.url().endsWith(asset)) requests.push(request.url()); });
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route(`**/${asset}`, async route => { await gate; await route.continue(); });
      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".summary-cover", { state: "attached" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000);
        assert.equal(requests.length, 0, "No cover request during the quiet opening");
        assert.equal(await page.locator(".summary-cover img").count(), 0);
        assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
        assert.equal(await page.locator(".greeting-frame").count(), 3);
        const reserved = await geometry(page);
        const frame = reserved[".summary-cover"];
        assert.ok(Math.abs(frame.width / frame.height - 1200 / 630) < .001);
        assert.ok(frame.x >= 16 && frame.x + frame.width <= width - 16, "Keep mobile side margins");

        await page.locator("#day2").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
        await page.waitForFunction(() => !!document.querySelector(".summary-cover img"));
        await page.waitForTimeout(150);
        assert.equal(requests.length, 1, "Prepare the cover during Day 2, before the ending");
        assert.equal(await page.locator(".summary-cover img").getAttribute("fetchpriority"), "low");
        assert.deepEqual(await geometry(page), reserved, "Mounting the pending image must not shift information");
        await page.locator("#info-summary").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
        await page.waitForTimeout(150);
        const y = await page.evaluate(() => scrollY);
        release();
        await page.waitForFunction(() => document.querySelector(".summary-cover img")?.naturalWidth === 1200);
        assert.deepEqual(await geometry(page), reserved, "Slow image decoding must not shift information");
        assert.equal(await page.evaluate(() => scrollY), y, "No scroll jump when the cover arrives");
        assert.ok(await page.locator(".summary-cover img").evaluate(e => {
          const image = e.getBoundingClientRect(), frame = e.parentElement.getBoundingClientRect();
          return Math.abs(image.width - frame.width) < .1 && Math.abs(image.height - frame.height) < .1
            && getComputedStyle(e).objectFit === "contain";
        }), "Show the complete image, with no crop");
        assert.ok(await page.locator("#ending").evaluate(e => e.nextElementSibling.id === "info-summary"));
        assert.ok(await page.locator(".summary-cover").evaluate(e => e.nextElementSibling.classList.contains("summary-heading")));
        assert.equal(await page.locator(".summary-card").count(), 2);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.locator("#info-summary").screenshot({ path: `test-results/summary-cover/${engine.name()}-${width}.png` });
        for (const delta of [60, -60]) {
          await page.evaluate(top => scrollBy({ top, behavior: "instant" }), delta);
          await page.waitForTimeout(100);
          assert.deepEqual(await geometry(page), reserved);
        }
        assert.equal(requests.length, 1, "Do not refetch when scrolling back");
        assert.deepEqual(errors, []);
        console.log(`${engine.name()} ${width}: deferred cover, slow-load reserved space, complete framing, ordering and reverse scroll passed`);
      } finally { release(); await page.close(); }
    }
    // A guest can skip directly to the final sheet; it must not depend on
    // visiting Day 2 first. Check this with reduced motion as well.
    const direct = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    await mutedSession(direct);
    const target = new URL(url); target.hash = "info-summary";
    await direct.goto(target.href, { waitUntil: "domcontentloaded" });
    await direct.waitForFunction(() => document.querySelector(".summary-cover img")?.naturalWidth === 1200);
    assert.ok(Math.abs(await direct.locator("#info-summary").evaluate(e => e.getBoundingClientRect().top)) < 2);
    assert.equal(await direct.locator(".invitation").getAttribute("data-audio-status"), "off");
    console.log(`${engine.name()}: direct summary link and reduced motion passed`);
  } finally { await browser.close(); }
}
