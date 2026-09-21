import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
await mkdir("test-results/town", { recursive: true });
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const width of [320, 390, 430, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: true, isMobile: width < 700 });
      await mutedSession(page);
      await page.addInitScript(() => sessionStorage.setItem("mm-wishes", '["coffee"]'));
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(`${url}#party`, { waitUntil: "networkidle" });
      await page.locator(".town-map").evaluate(e => e.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForTimeout(1000);
      assert.equal(await page.locator(".map-stop").count(), 9);
      assert.equal(await page.locator("button.map-tree").count(), 5);
      assert.equal(await page.locator(".town-map .check, .town-map .selected, .town-map [aria-pressed]").count(), 0);
      const controls = page.locator(".map-stop, .map-tree");
      for (const control of await controls.all()) {
        assert.equal(await control.locator('xpath=ancestor::*[@aria-hidden="true"]').count(), 0);
        await control.evaluate(e => e.scrollIntoView({ block: "center", behavior: "instant" }));
        assert.ok(await control.evaluate(e => {
          const r = e.getBoundingClientRect();
          return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }), "Every activity and tree must have an unobstructed tap target");
        await control.tap();
        const isTree = await control.evaluate(e => e.classList.contains("map-tree"));
        assert.equal(await control.evaluate(e => e.getAnimations({ subtree: true }).length), isTree ? 5 : 1);
        await page.waitForTimeout(120);
        assert.notEqual(await control.locator(isTree ? ".pixel-icon" : ".map-icon").evaluate(e => getComputedStyle(e).transform), "none");
        if (isTree) {
          await page.waitForTimeout(160);
          assert.ok(await control.locator(".falling-leaf").evaluateAll(es => es.some(e => +getComputedStyle(e).opacity > 0)));
        }
        // Rapid repeated taps restart one bounded animation set.
        await control.evaluate(e => { for (let i = 0; i < 20; i++) e.click(); });
        assert.equal(await control.evaluate(e => e.getAnimations({ subtree: true }).length), isTree ? 5 : 1);
      }
      await page.waitForTimeout(1500);
      assert.equal(await controls.evaluateAll(es => es.flatMap(e => e.getAnimations({ subtree: true })).length), 0);
      assert.ok(await page.locator(".falling-leaf").evaluateAll(es => es.every(e => getComputedStyle(e).opacity === "0")));
      assert.equal(await page.evaluate(() => sessionStorage.getItem("mm-wishes")), '["coffee"]', "No checklist storage writes");

      const tree = page.locator(".tree-one");
      await tree.focus();
      await page.keyboard.press("Enter");
      assert.equal(await tree.evaluate(e => e.getAnimations({ subtree: true }).length), 5);
      await page.waitForTimeout(220);
      if (width === 390) await page.locator(".town-map").screenshot({ path: `test-results/town/${engine.name()}-leaves.png`, animations: "allow" });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForTimeout(100);
      assert.equal(await tree.evaluate(e => e.getAnimations({ subtree: true }).length), 0);
      for (const control of [tree, page.locator('[data-activity="coffee"]')]) {
        await control.focus();
        await page.keyboard.press("Space");
        const frames = await control.evaluate(e => e.getAnimations({ subtree: true }).flatMap(a => a.effect.getKeyframes()));
        assert.ok(frames.length > 0 && frames.every(frame => !frame.transform), "Reduced motion only changes opacity");
      }
      assert.ok(await page.locator(".falling-leaf").evaluateAll(es => es.every(e => getComputedStyle(e).opacity === "0")));
      await page.waitForTimeout(350);
      assert.equal(await controls.evaluateAll(es => es.flatMap(e => e.getAnimations({ subtree: true })).length), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      console.log(`${engine.name()} ${width}: all 14 tap targets, shake, four leaves, repeat/cleanup, keyboard, reduced motion passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
