import { chromium, webkit } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { mutedSession } from "./muted-session.mjs";

await mkdir("test-results", { recursive: true });
const url = process.env.PREVIEW_URL || "http://127.0.0.1:5173";
const engine = process.env.BROWSER_ENGINE || "chromium";
const browser =
  engine === "webkit"
    ? await webkit.launch()
    : await chromium.launch({
        executablePath:
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: true,
      });
const report = [];
try {
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
    [1440, 1000],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: width < 500 ? 2 : 1,
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    const page = await context.newPage();
    await mutedSession(page);
    const errors = [],
      badResponses = [],
      audioRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        badResponses.push(`${response.status()} ${response.url()}`);
    });
    page.on("request", (request) => {
      if (
        new URL(request.url()).pathname.startsWith(
          new URL("audio/", url.endsWith("/") ? url : `${url}/`).pathname,
        )
      )
        audioRequests.push(request.url());
    });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      audioRequests.length,
      0,
      "Audio must not load on initial page visit",
    );
    assert.equal(
      await page.locator(".invitation").getAttribute("data-audio-status"),
      "off",
    );
    const initialBytes = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
    );
    assert.ok(initialBytes < 3 * 1024 * 1024, "Initial transfer exceeds 3 MB");
    await page.screenshot({
      path: `test-results/${engine}-${width}-opening.png`,
    });
    // Use instant positioning to inspect normal animation rendering without disabling it.
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = "auto"),
    );
    if (width === 390) {
      await page
        .locator(".greeting")
        .evaluate((element) =>
          scrollTo(0, (element.offsetHeight - innerHeight) / 2),
        );
      await page.waitForTimeout(250);
      assert.equal(
        await page
          .locator(".greeting-frame")
          .nth(1)
          .getAttribute("aria-hidden"),
        "false",
      );
      await page.screenshot({
        path: `test-results/${engine}-390-greeting-scroll.png`,
      });
    }
    for (const selector of [
      "#day1",
      "#day1-info",
      ".world-transition",
      "#day2",
      "#day2-info",
      "#party",
      "#ending",
      "#memory-wall",
      "#info-summary",
    ]) {
      await page
        .locator(selector)
        .evaluate((element) =>
          window.scrollTo(0, element.getBoundingClientRect().top + scrollY),
        );
      await page.waitForTimeout(950);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width}: horizontal overflow at ${selector}`,
      );
      const broken = await page
        .locator("img")
        .evaluateAll((images) =>
          images
            .filter(
              (img) =>
                img.getBoundingClientRect().top < innerHeight &&
                img.getBoundingClientRect().bottom > 0 &&
                (!img.complete || img.naturalWidth === 0),
            )
            .map((img) => img.src),
        );
      assert.deepEqual(broken, [], `Broken visible image at ${selector}`);
      if (width === 390)
        await page.screenshot({
          path: `test-results/${engine}-${width}-${selector.replace(/[^a-z0-9]/gi, "")}.png`,
        });
      if (width === 390 && selector === ".world-transition") {
        for (const fraction of [0.4, 0.9]) {
          await page
            .locator(selector)
            .evaluate(
              (element, fraction) =>
                scrollTo(
                  0,
                  element.getBoundingClientRect().top +
                    scrollY +
                    (element.offsetHeight - innerHeight) * fraction,
                ),
              fraction,
            );
          await page.waitForTimeout(250);
          await page.screenshot({
            path: `test-results/${engine}-390-transition-${fraction}.png`,
          });
        }
      }
    }
    assert.equal(
      audioRequests.length,
      0,
      "Scrolling without consent must never fetch audio",
    );
    assert.equal(await page.locator(".story-photo").count(), 0);
    assert.equal(await page.locator("#memory-wall .snapshot").count(), 11);
    assert.equal(await page.locator(".venue-placeholder").count(), 0);
    assert.equal(await page.locator(".venue-photo img").count(), 2);
    assert.equal(
      await page.locator("#day1-info .map-actions a").getAttribute("href"),
      "https://surl.amap.com/mzxjIZkp9A1",
    );
    assert.equal(
      await page.locator("#day2-info .map-actions a").getAttribute("href"),
      "https://surl.amap.com/dCdJgKy170lF",
    );
    await page.locator("#party").scrollIntoViewIfNeeded();
    const coffee = page.locator(".map-stop").first();
    await coffee.click();
    assert.equal(await coffee.getAttribute("aria-pressed"), "true");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await coffee.getAttribute("aria-pressed"), "true");
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = "auto"),
    );
    if (width === 390) {
      await page.locator("#day1").evaluate((element) =>
        scrollTo(0, element.getBoundingClientRect().top + scrollY),
      );
      await page.waitForTimeout(300);
      await page.locator(".music-control").click();
      await page.waitForFunction(
        () =>
          document.querySelector(".invitation").dataset.audioTrack === "day1" &&
          document.querySelector(".invitation").dataset.audioStatus ===
            "playing",
      );
      assert.ok(
        audioRequests.some((request) => request.endsWith("/rain.mp3")),
        "Day 1 must request Rain after consent",
      );
      for (const [selector, scene, file] of [
        [".world-transition", "transition", "fall.mp3"],
        ["#day2", "day2", "flower-dance.mp3"],
        ["#party", "party", "pelican-town.mp3"],
        ["#ending", "ending", "moonlight-jellies.mp3"],
      ]) {
        await page
          .locator(selector)
          .evaluate((element) =>
            scrollTo(0, element.getBoundingClientRect().top + scrollY),
          );
        await page.waitForFunction(
          ({ scene }) =>
            document.querySelector(".invitation").dataset.scene === scene &&
            document.querySelector(".invitation").dataset.audioStatus ===
              "playing" &&
            document.querySelector(".invitation").dataset.audioTrack === scene,
          { scene },
          { timeout: 20000 },
        );
        assert.ok(
          audioRequests.some((request) => request.endsWith(file)),
          `Missing track: ${file}`,
        );
      }
      await page.locator(".music-control").click();
      assert.equal(
        await page.locator(".invitation").getAttribute("data-audio-status"),
        "off",
      );
      await page
        .locator("#day2")
        .evaluate((element) =>
          scrollTo(0, element.getBoundingClientRect().top + scrollY),
        );
      await page.waitForTimeout(500);
      assert.equal(
        await page.locator(".invitation").getAttribute("data-audio-status"),
        "off",
      );
      await page.locator(".music-control").click();
      await page.waitForFunction(
        () =>
          document.querySelector(".invitation").dataset.audioStatus ===
          "playing",
      );
    }
    assert.deepEqual(errors, [], "Browser errors");
    assert.deepEqual(badResponses, [], "Failed resources");
    report.push({
      engine,
      width,
      height,
      errors,
      badResponses,
      audioRequests: audioRequests.length,
      initialBytes,
      result: "pass",
    });
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(
    await page
      .locator(".greeting-frame")
      .first()
      .evaluate((element) => getComputedStyle(element).position),
    "relative",
  );
  await page.screenshot({ path: `test-results/${engine}-reduced-motion.png` });
  await context.close();
  await writeFile(
    `test-results/${engine}-report.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
