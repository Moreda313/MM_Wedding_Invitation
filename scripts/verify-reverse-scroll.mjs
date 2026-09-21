import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
import { mutedSession } from "./muted-session.mjs";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const selectors = ["#hello", ".greeting-sticky", "#day1", ".couple-photo",
  ".world-transition", ".transition-sticky", ".portal", "#day2", "#memory-wall", "#ending", "#info-summary"];
const settle = page => page.waitForTimeout(150);
const geometry = page => page.evaluate(selectors => Object.fromEntries(selectors.map(selector => {
  const rect = document.querySelector(selector).getBoundingClientRect();
  return [selector, { top: rect.top + scrollY, width: rect.width, height: rect.height }];
})), selectors);
const state = page => page.evaluate(() => ({
  frame: [...document.querySelectorAll(".greeting-frame")].findIndex(e => e.classList.contains("is-current")),
  stage: document.querySelector(".invitation").dataset.openingStage,
  scene: document.querySelector(".invitation").dataset.scene,
  progress: document.querySelector(".transition-sticky").style.getPropertyValue("--transition-progress"),
  revealed: document.querySelector(".world-transition").classList.contains("is-revealed"),
}));
function sameGeometry(actual, expected, label) {
  for (const selector of selectors) for (const key of ["top", "width", "height"])
    assert.ok(Math.abs(actual[selector][key] - expected[selector][key]) < .1,
      `${label}: ${selector} ${key}: ${actual[selector][key]} vs ${expected[selector][key]}`);
}
async function position(page, selector, fraction) {
  await page.locator(selector).evaluate((e, fraction) => {
    const distance = e.getBoundingClientRect().height - e.firstElementChild.getBoundingClientRect().height;
    scrollTo({ top: e.getBoundingClientRect().top + scrollY + distance * fraction, behavior: "instant" });
  }, fraction);
  // Let the intended 400ms teaser crossfade finish before measuring geometry.
  await page.waitForTimeout(500);
}

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const [width, height] of [[375, 812], [390, 844], [430, 932]]) {
      const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
      await mutedSession(page);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.querySelector(".couple-photo")?.naturalWidth > 0);
      await page.evaluate(() => document.fonts.ready);
      // Isolate viewport changes from subpixel rounding when a responsive
      // venue image replaces its declared ratio with its decoded dimensions.
      await page.locator(".venue-photo img").evaluateAll(async images => {
        await Promise.all(images.map(image => {
          image.loading = "eager";
          return image.decode();
        }));
      });
      await settle(page);

      // Reproduce browser chrome changing JS's visible viewport while CSS's
      // small viewport stays the same. Neither direction may flip the greeting.
      for (const fraction of [.74, .76]) {
        await position(page, "#hello", fraction);
        const before = await state(page);
        assert.equal(before.frame, fraction < .75 ? 1 : 2);
        assert.equal(before.stage, fraction < .75 ? "opening" : "announcement");
        await page.evaluate(() => { window.__heightDescriptor = Object.getOwnPropertyDescriptor(window, "innerHeight"); });
        for (const value of [height + 100, height - 100, height]) {
          await page.evaluate(value => {
            Object.defineProperty(window, "innerHeight", { configurable: true, value });
            dispatchEvent(new Event("resize"));
          }, value);
          await settle(page);
          assert.deepEqual(await state(page), before, "Toolbar alone must not change the story/music phase");
        }
        await page.evaluate(() => {
          Object.defineProperty(window, "innerHeight", window.__heightDescriptor);
          delete window.__heightDescriptor;
        });
      }

      // Some embedded browsers also resize the CSS viewport. Previously this
      // moved every downstream section (WebKit's wall jumped by ~582px).
      for (const [selector, fraction] of [["#hello", .74], [".world-transition", .21], [".world-transition", .62]]) {
        await position(page, selector, fraction);
        const before = await geometry(page), phase = await state(page), y = await page.evaluate(() => scrollY);
        for (const h of [height - 104, height + 60, height]) {
          await page.setViewportSize({ width, height: h });
          await settle(page);
          sameGeometry(await geometry(page), before, "Mobile height-only resize");
          assert.equal(await page.evaluate(() => scrollY), y);
          assert.deepEqual(await state(page), phase);
        }
      }
      for (const selector of ["#day1", "#day2", "#memory-wall", "#ending"]) {
        await page.locator(selector).evaluate(e => e.scrollIntoView({ behavior: "instant" }));
        await page.waitForTimeout(900);
        const before = await geometry(page), y = await page.evaluate(() => scrollY);
        await page.setViewportSize({ width, height: height - 104 });
        await settle(page);
        sameGeometry(await geometry(page), before, "Reading position on toolbar return");
        assert.equal(await page.evaluate(() => scrollY), y);
        await page.setViewportSize({ width, height });
        await settle(page);
        // Upward scroll reveals fixed shortcuts without moving document content.
        await page.evaluate(() => scrollBy({ top: 120, behavior: "instant" }));
        await settle(page);
        await page.evaluate(() => scrollBy({ top: -48, behavior: "instant" }));
        await settle(page);
        assert.equal(await page.locator(".day-nav").getAttribute("data-visible"), "true");
        sameGeometry(await geometry(page), before, "Navigation reveal");
      }

      // Actual down/up travel still runs the same animation in reverse.
      for (const selector of ["#hello", ".world-transition"]) {
        const samples = [];
        for (const fraction of [.1, .3, .5, .7, .9]) {
          await position(page, selector, fraction);
          samples.push(await state(page));
        }
        for (const [index, fraction] of [[4, .9], [3, .7], [2, .5], [1, .3], [0, .1]]) {
          await position(page, selector, fraction);
          assert.deepEqual(await state(page), samples[index], "Reverse scroll must be deterministic");
        }
      }

      await page.setViewportSize({ width: height, height: width });
      await settle(page);
      assert.ok(Math.abs((await geometry(page))[".greeting-sticky"].height - width) < 1, "Rotation remeasures the screen");
      await page.setViewportSize({ width, height });
      await settle(page);
      assert.ok(Math.abs((await geometry(page))[".greeting-sticky"].height - height) < 1);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#memory-wall").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
      await settle(page);
      const reduced = await geometry(page);
      await page.setViewportSize({ width, height: height - 104 });
      await settle(page);
      sameGeometry(await geometry(page), reduced, "Reduced motion toolbar return");
      assert.deepEqual(errors, []);
      console.log(`${engine.name()} ${width}: toolbar resize, stable photos/sections, upward navigation, reverse animation, rotation and reduced motion passed`);
      await page.close();
    }
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await mutedSession(desktop);
    await desktop.goto(url, { waitUntil: "domcontentloaded" });
    await desktop.waitForSelector(".greeting-sticky");
    await desktop.setViewportSize({ width: 1440, height: 800 });
    await settle(desktop);
    assert.equal((await geometry(desktop))[".greeting-sticky"].height, 800, "Desktop resizing still responds");
    const anchor = new URL(url); anchor.hash = "day2-info";
    await desktop.goto("about:blank");
    await desktop.goto(anchor.href, { waitUntil: "domcontentloaded" });
    await desktop.waitForSelector("#day2-info");
    await settle(desktop);
    const anchorTop = await desktop.locator("#day2-info").evaluate(e => e.getBoundingClientRect().top);
    assert.ok(Math.abs(anchorTop - 80) < 2, "Direct hash entry still reaches the intended section");
    console.log(`${engine.name()}: desktop resize and direct anchor passed`);
  } finally { await browser.close(); }
}
