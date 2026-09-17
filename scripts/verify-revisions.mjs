import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:5173";
const engine = process.env.BROWSER_ENGINE || "chromium";
const browser =
  engine === "webkit"
    ? await webkit.launch()
    : await chromium.launch({
        executablePath:
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      });
await mkdir("test-results", { recursive: true });
try {
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = "auto"),
    );
    // Stop between the old exact positions, at boundaries, and when scrolling back.
    for (const fraction of [
      0.07, 0.124, 0.126, 0.23, 0.374, 0.376, 0.49, 0.51, 0.624, 0.626, 0.87,
      0.93, 0.42, 0.1,
    ]) {
      await page
        .locator(".greeting")
        .evaluate(
          (element, fraction) =>
            scrollTo(0, (element.offsetHeight - innerHeight) * fraction),
          fraction,
        );
      await page.waitForTimeout(450);
      const frames = await page
        .locator(".greeting-frame")
        .evaluateAll((elements) =>
          elements.map((element) => ({
            opacity: +getComputedStyle(element).opacity,
            filter: getComputedStyle(element).filter,
            active: element.getAttribute("aria-hidden") === "false",
          })),
        );
      assert.equal(
        frames.filter(
          (frame) =>
            frame.opacity === 1 && frame.filter === "none" && frame.active,
        ).length,
        1,
        `Text must settle fully clear at ${fraction}`,
      );
      assert.equal(
        frames.filter((frame) => frame.opacity > 0).length,
        1,
        "Only one sentence remains visible",
      );
    }
    await page.screenshot({
      path: `test-results/${engine}-${width}-clear-greeting.png`,
    });
    await page
      .locator(".world-transition")
      .evaluate((element) =>
        scrollTo(0, element.getBoundingClientRect().top + scrollY),
      );
    await page.waitForTimeout(500);
    assert.equal(
      await page.locator(".transition-teaser").getAttribute("aria-hidden"),
      "false",
    );
    await page.screenshot({
      path: `test-results/${engine}-${width}-one-more-thing.png`,
    });
    const button = page.locator(".pixel-enter");
    const box = await button.boundingBox();
    assert.ok(
      box && box.y > 65 && box.y + box.height < height - 65,
      "Pixel button must be visible above navigation",
    );
    // Exercise the normal smooth anchor path, including the sticky transition section.
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = ""),
    );
    await button.click();
    await page.waitForFunction(
      () =>
        Math.abs(
          document.querySelector("#day2").getBoundingClientRect().top - 80,
        ) < 3,
    );
    assert.equal(
      await page.locator(".invitation").getAttribute("data-audio-status"),
      "off",
      "Entering Day 2 must not enable music",
    );
    assert.equal(
      await page
        .locator("#day2")
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = "auto"),
    );
    await page
      .locator(".world-transition")
      .evaluate((element) =>
        scrollTo(
          0,
          element.getBoundingClientRect().top +
            scrollY +
            (element.offsetHeight - innerHeight) * 0.8,
        ),
      );
    await page.waitForTimeout(500);
    assert.equal(
      await page.locator(".transition-world").getAttribute("aria-hidden"),
      "false",
    );
    const copy = await page.locator(".transition-caption").boundingBox();
    const revealedButton = await button.boundingBox();
    assert.ok(
      copy && revealedButton && copy.y + copy.height < revealedButton.y,
      "Reveal content must not overlap the button",
    );
    await page.screenshot({
      path: `test-results/${engine}-${width}-pixel-reveal.png`,
    });
    await page
      .locator("#day2")
      .evaluate((element) =>
        scrollTo(0, element.getBoundingClientRect().top + scrollY),
      );
    await page.waitForFunction(
      () => document.querySelector(".invitation").dataset.scene === "day2",
    );
    assert.match(
      await page.locator("#day1-info .schedule").innerText(),
      /下午\s+草坪婚礼\s+晚上\s+晚宴/,
    );
    assert.match(
      await page.locator("#day2-info .schedule").innerText(),
      /11:00\s+午宴开始/,
    );
    assert.doesNotMatch(
      await page.locator("#day2-info .schedule").innerText(),
      /12:00|14:00|暂定/,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      `${engine} ${width}×${height}: clear stopped text, reveal, button, scroll entry and schedules passed`,
    );
    await page.close();
  }
  const reduced = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await reduced.goto(url, { waitUntil: "networkidle" });
  assert.equal(
    await reduced.locator('.greeting-frame[aria-hidden="false"]').count(),
    5,
  );
  await reduced.locator(".pixel-enter").click();
  await reduced.waitForFunction(
    () =>
      Math.abs(
        document.querySelector("#day2").getBoundingClientRect().top - 80,
      ) < 3,
  );
  console.log(`${engine}: reduced-motion reading and direct entry passed`);
  await reduced.close();
} finally {
  await browser.close();
}
