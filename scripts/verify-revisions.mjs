import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { mutedSession } from "./muted-session.mjs";

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
    await mutedSession(page);
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = "auto"),
    );
    assert.equal(await page.locator(".invitation").getAttribute("data-opening-stage"), "opening");
    for (const selector of [".brand", ".day-nav"]) {
      assert.equal(await page.locator(selector).evaluate((element) => element.inert), true);
      assert.equal(await page.locator(selector).evaluate((element) => getComputedStyle(element).opacity), "0");
    }
    assert.equal(await page.locator(".music-shell").evaluate((element) => element.inert), true);
    const font = await page.locator(".first-greeting h1").evaluate((element) => ({
      size: parseFloat(getComputedStyle(element).fontSize),
      family: getComputedStyle(element).fontFamily,
    }));
    assert.ok(font.size >= 56 && font.size <= 64);
    assert.ok(!/Songti|Georgia|SimSun/.test(font.family), "Opening must use modern sans-serif");
    // The incoming sentence stays pale long enough to notice, then always settles.
    await page.locator(".greeting").evaluate((element) =>
      scrollTo({ top: (element.offsetHeight - innerHeight) * 0.5, behavior: "instant" }),
    );
    await page.waitForTimeout(450);
    const midway = await page.locator(".greeting-frame.is-current").evaluate((element) => +getComputedStyle(element).opacity);
    assert.ok(midway > 0.03 && midway < 0.65, `Expected a slow fade, got ${midway}`);
    // Stop between the old exact positions, at boundaries, and when scrolling back.
    for (const fraction of [
      0.07, 0.249, 0.251, 0.49, 0.51, 0.749, 0.751, 0.93, 0.42, 0.1,
    ]) {
      await page
        .locator(".greeting")
        .evaluate(
          (element, fraction) =>
            scrollTo(0, (element.offsetHeight - innerHeight) * fraction),
          fraction,
        );
      await page.waitForTimeout(1450);
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
    await page.locator(".greeting").evaluate((element) =>
      scrollTo(0, (element.offsetHeight - innerHeight) * 0.92),
    );
    await page.waitForTimeout(1450);
    assert.equal(await page.locator(".invitation").getAttribute("data-opening-stage"), "announcement");
    assert.equal(await page.locator(".music-shell").evaluate((element) => element.inert), false);
    assert.equal(await page.locator(".brand").evaluate((element) => element.inert), true);
    assert.equal(await page.locator(".day-nav").evaluate((element) => element.inert), true);
    await page.screenshot({ path: `test-results/${engine}-${width}-announcement.png` });
    await page.locator("#day1").evaluate((element) =>
      scrollTo(0, element.getBoundingClientRect().top + scrollY),
    );
    await page.waitForTimeout(750);
    assert.equal(await page.locator(".invitation").getAttribute("data-opening-stage"), "invitation");
    for (const selector of [".brand", ".music-shell", ".day-nav"]) {
      assert.equal(await page.locator(selector).evaluate((element) => element.inert), false);
      assert.equal(await page.locator(selector).evaluate((element) => getComputedStyle(element).opacity), "1");
    }
    // Card surfaces stay neutral; color is confined to the stall accents.
    const stalls = await page.locator(".stop-label").evaluateAll((elements) =>
      elements.map((element) => ({ bg: getComputedStyle(element).backgroundColor, border: getComputedStyle(element).borderColor })),
    );
    assert.equal(new Set(stalls.map((stall) => stall.bg)).size, 1);
    assert.ok(new Set(stalls.map((stall) => stall.border)).size >= 6);
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
      /下午14:00\s+草坪婚礼\s+雷迪森酒店草坪\s+晚上17:30\s+晚宴/,
    );
    assert.match(
      await page.locator("#day2-info .schedule").innerText(),
      /11:00\s+午宴开始/,
    );
    assert.doesNotMatch(
      await page.locator("#day2-info .schedule").innerText(),
      /12:00|暂定/,
    );
    assert.match(await page.locator("#day2-info .schedule").innerText(), /14:00\s+草坪婚礼与派对\s+遂昌源口大草坪/);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      `${engine} ${width}×${height}: slow clear text, staged controls, neutral/colorful stalls, reveal, button and schedules passed`,
    );
    await page.close();
  }
  const direct = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mutedSession(direct);
  await direct.goto(`${url}#day2-info`, { waitUntil: "networkidle" });
  await direct.waitForFunction(() =>
    document.querySelector(".invitation").dataset.openingStage === "invitation" &&
    Math.abs(document.querySelector("#day2-info").getBoundingClientRect().top - 80) < 3,
  );
  await direct.evaluate(() => {
    scrollTo({ top: 0, behavior: "instant" });
  });
  await direct.waitForFunction(() =>
    [...document.querySelectorAll(".brand, .day-nav")].every((element) =>
      element.inert && getComputedStyle(element).opacity === "0"),
  );
  assert.equal(await direct.locator(".invitation").getAttribute("data-opening-stage"), "opening");
  for (const selector of [".brand", ".day-nav"]) {
    assert.equal(await direct.locator(selector).evaluate((element) =>
      element.inert && getComputedStyle(element).opacity === "0"), true);
  }
  console.log(`${engine}: direct chapter entry and immersive opening on return passed`);
  await direct.close();
  const reduced = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await mutedSession(reduced);
  await reduced.goto(url, { waitUntil: "networkidle" });
  assert.equal(
    await reduced.locator('.greeting-frame[aria-hidden="false"]').count(),
    3,
  );
  await reduced.locator(".greeting-frame").last().evaluate((element) =>
    scrollTo(0, element.getBoundingClientRect().top + scrollY - innerHeight * 0.4),
  );
  await reduced.waitForFunction(() => document.querySelector(".invitation").dataset.openingStage === "announcement");
  assert.equal(await reduced.locator(".music-shell").evaluate((element) => element.inert), false);
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
