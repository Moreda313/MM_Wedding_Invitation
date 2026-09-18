import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { mutedSession } from "./muted-session.mjs";
const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
await mkdir("test-results", { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? {
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  } : {});
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932], [1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700 });
      await mutedSession(page);
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.evaluate(() => document.fonts.check('60px "Wedding Script"', "Hi")));
      assert.ok(await page.locator(".first-greeting .greeting-note").evaluate(e => parseFloat(getComputedStyle(e).fontSize) >= 22));
      assert.ok(await page.locator(".greeting").evaluate(e => Math.abs(e.offsetHeight / innerHeight - 2.6) < .01));
      await page.screenshot({ path: `test-results/${engine.name()}-${width}-new-hi.png` });
      await page.locator(".greeting").evaluate(e => scrollTo({ top: (e.offsetHeight - innerHeight) * .5, behavior: "instant" }));
      await page.waitForTimeout(1050);
      assert.match(await page.locator(".greeting-frame.is-current").innerText(), /浪漫的人生时刻/);
      assert.equal(await page.locator(".greeting-frame.is-current").evaluate(e => getComputedStyle(e).opacity), "1");
      for (const id of ["day1", "day2"]) {
        await page.locator(`#${id}-info .venue-photo`).evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
        const img = page.locator(`#${id}-info .venue-photo img`);
        await img.evaluate(e => e.decode());
        await page.waitForTimeout(900);
        const dimensions = await img.evaluate(e => ({ width: e.clientWidth, height: e.clientHeight, src: e.currentSrc }));
        assert.ok(Math.abs(dimensions.width / dimensions.height - 4 / 3) < .01, "Preserve the complete venue image");
        assert.ok(dimensions.src.includes(`${id}-place-`));
        assert.match(await page.locator(`#${id}-info .venue-full`).getAttribute("href"), /1440\.webp$/);
        await page.screenshot({ path: `test-results/${engine.name()}-${width}-${id}-venue.png` });
      }
      assert.match(await page.locator("#day1-info .schedule").innerText(), /上午\s+接新娘\s+下午\s+草坪婚礼\s+晚上\s+晚宴/);
      assert.match(await page.locator(".summary-day1 .summary-schedule").innerText(), /上午\s+接新娘/);
      assert.equal(await page.locator(".transition-teaser .eyebrow").innerText(), "等等，似乎还差点什么？");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`${engine.name()} ${width}: faster greeting, large notes, local calligraphy, intact venue images and morning schedule passed`);
    }
  } finally { await browser.close(); }
}
