import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
await mkdir("test-results/layout-v2", { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: true });
      await mutedSession(page);
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: "networkidle" });
      const nav = page.locator(".day-nav");
      assert.equal(await nav.getAttribute("data-visible"), "false");
      assert.equal(await page.locator(".music-shell").getAttribute("data-visible"), "false");
      assert.ok(await page.locator(".world-transition").evaluate(e => Math.abs(e.offsetHeight / innerHeight - 2) < .02));
      assert.ok(await page.locator(".greeting").evaluate(e => Math.abs(e.offsetHeight / innerHeight - 2.6) < .02));
      for (const id of ["day1", "day1-info", "day2", "day2-info", "party", "memory-wall", "ending", "info-summary"]) {
        await page.locator(`#${id}`).evaluate(e => e.scrollIntoView({ behavior: "instant", block: "start" }));
        await page.waitForTimeout(100);
      }
      for (const id of ["day1", "day2"]) {
        const data = await page.locator(`#${id}-info`).evaluate(e => {
          const date = e.querySelector(".big-date").getBoundingClientRect();
          const year = e.querySelector(".date-year").getBoundingClientRect();
          const card = e.querySelector(".invitation-card").getBoundingClientRect();
          return { dateRight: date.right, yearLeft: year.left, yearRight: year.right, cardRight: card.right,
            captionSize: parseFloat(getComputedStyle(e.querySelector("figcaption")).fontSize), height: e.offsetHeight };
        });
        assert.ok(data.captionSize >= 12);
        if (width < 700) {
          assert.ok(data.dateRight <= data.yearLeft, "Date and year must not overlap");
          assert.ok(data.yearRight <= data.cardRight, "Year stays inside card");
        }
        if (width === 390) assert.ok(data.height < 1150, "Information pages are more compact");
      }
      const background = await page.locator("#memory-wall").evaluate(e => getComputedStyle(e).backgroundColor);
      assert.equal(background, await page.locator(".day-two").evaluate(e => getComputedStyle(e).backgroundColor));
      assert.equal(await page.locator("#memory-wall .eyebrow").count(), 0);
      assert.equal(await page.locator("#memory-wall").getAttribute("data-music"), "party");
      assert.equal(await page.locator("#ending").getAttribute("data-music"), "ending");
      assert.ok(await page.locator("#memory-wall").evaluate(e => e.nextElementSibling.id === "ending"));
      assert.ok(await page.locator("#ending").evaluate(e => e.nextElementSibling.id === "info-summary"));
      assert.ok(await page.locator(".stop-label").evaluateAll(es => es.every(e => parseFloat(getComputedStyle(e).fontSize) >= 11)));
      // Deliberate user-sized scrolls (not anchor jumps) exercise hide/show behavior.
      await page.locator("#day1-info").evaluate(e => e.scrollIntoView({ behavior: "instant", block: "start" }));
      await page.waitForTimeout(150);
      await page.evaluate(() => scrollBy({ top: 100, behavior: "instant" }));
      await page.waitForFunction(() => document.querySelector(".day-nav").dataset.visible === "false");
      assert.equal(await nav.evaluate(e => e.inert), true);
      await page.evaluate(() => scrollBy({ top: -50, behavior: "instant" }));
      await page.waitForFunction(() => document.querySelector(".day-nav").dataset.visible === "true");
      assert.equal(await nav.evaluate(e => e.inert), false);
      await page.evaluate(() => scrollBy({ top: 100, behavior: "instant" }));
      await page.waitForFunction(() => document.querySelector(".day-nav").dataset.visible === "false");
      await page.keyboard.press("Tab");
      await page.waitForFunction(() => document.querySelector(".day-nav").dataset.visible === "true");
      await nav.locator('a[href="#info-summary"]').click();
      await page.waitForFunction(() => Math.abs(document.querySelector("#info-summary").getBoundingClientRect().top) < 85);
      await page.evaluate(() => scrollBy({ top: 120, behavior: "instant" }));
      await page.waitForTimeout(150);
      assert.equal(await nav.getAttribute("data-visible"), "true", "Summary keeps navigation available");
      // Pointer interaction in the map must remain unobstructed by larger labels.
      for (const stop of await page.locator(".map-stop").all()) {
        await stop.evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
        await stop.click();
        assert.equal(await stop.getAttribute("aria-pressed"), "true");
      }
      if (width === 390) {
        for (const id of ["day1-info", "day2-info", "party", "memory-wall", "ending", "info-summary"]) {
          await page.locator(`#${id}`).evaluate(e => e.scrollIntoView({ behavior: "instant", block: "start" }));
          await page.waitForTimeout(1000);
          await page.locator(`#${id}`).screenshot({ path: `test-results/layout-v2/${engine.name()}-${id}.png` });
        }
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await page.goto(`${url}#memory-wall`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.querySelector(".invitation").dataset.scene === "party");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#day1-info").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
      await page.evaluate(() => scrollBy({ top: 120, behavior: "instant" }));
      await page.waitForTimeout(150);
      assert.equal(await nav.getAttribute("data-visible"), "true");
      console.log(`${engine.name()} ${width}: compact layout, autumn wall, music boundaries, reading navigation, map taps and reduced motion passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
