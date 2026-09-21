import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
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
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mutedSession(page);
  await page.addInitScript(() => {
    const original = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function (audio) {
      window.__rain = audio;
      return original.call(this, audio);
    };
  });
  const audioRequests = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".mp3")) audioRequests.push(request.url());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(audioRequests.length, 0, "Remembered pause suppresses audio preloading");
  await page.evaluate(
    () => (document.documentElement.style.scrollBehavior = "auto"),
  );
  await page.locator("#day1").evaluate((element) =>
    scrollTo(0, element.getBoundingClientRect().top + scrollY),
  );
  await page.locator(".music-control").click();
  await page.waitForFunction(
    () => document.querySelector(".invitation").dataset.audioTrack === "day1",
    {},
    { timeout: 60000 },
  );
  await page.waitForFunction(() => window.__rain.currentTime > 0.2);
  assert.ok(
    await page.evaluate(
      () =>
        window.__rain.duration > 165 &&
        window.__rain.duration < 166 &&
        window.__rain.loop,
    ),
    "Short looping instrumental edit must be available",
  );
  await page.locator(".music-control").click();
  await page.waitForFunction(() => window.__rain.paused);
  const paused = await page.evaluate(() => window.__rain.currentTime);
  await page.waitForTimeout(350);
  assert.equal(
    await page.evaluate(() => window.__rain.currentTime),
    paused,
    "Mute must stop media playback",
  );
  await page.locator(".music-control").click();
  await page.waitForFunction(
    () =>
      window.__rain.currentTime > 0 &&
      !window.__rain.paused &&
      document.querySelector(".invitation").dataset.audioTrack === "day1",
  );
  await page
    .locator(".world-transition")
    .evaluate((element) =>
      scrollTo(0, element.getBoundingClientRect().top + scrollY),
    );
  await page.waitForFunction(
    () =>
      document.querySelector(".invitation").dataset.audioTrack === "transition",
    {},
    { timeout: 60000 },
  );
  await page.waitForFunction(() => window.__rain.paused);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector(".invitation").dataset.audioStatus === "off" && window.__rain.paused);
  await page.locator("#day1").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
  await page.waitForFunction(
    () =>
      document.querySelector(".invitation").dataset.audioTrack === "day1" &&
      !window.__rain.paused,
    {},
    { timeout: 60000 },
  );
  console.log(
    `${engine}: short Rain stream, consent, pause/resume, crossfade and scrolling back passed`,
  );
  // Also check enabling music in Day 2 first, then returning to Day 1.
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    scrollTo(
      0,
      document.querySelector("#day2").getBoundingClientRect().top + scrollY,
    );
  });
  await page.waitForFunction(
    () => document.querySelector(".invitation").dataset.scene === "day2",
  );
  await page.locator(".music-control").click();
  await page.waitForFunction(
    () => document.querySelector(".invitation").dataset.audioTrack === "day2",
    {},
    { timeout: 60000 },
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector(".invitation").dataset.audioStatus === "off");
  await page.locator("#day1").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
  await page.waitForFunction(
    () => document.querySelector(".invitation").dataset.audioTrack === "day1",
    {},
    { timeout: 60000 },
  );
  console.log(
    `${engine}: first gesture in Day 2, then Rain without a second gesture passed`,
  );
  await page.close();
} finally {
  await browser.close();
}
