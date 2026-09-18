import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const chrome = { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" };
const waitStatus = (page, status) => page.waitForFunction((status) =>
  document.querySelector(".invitation").dataset.audioStatus === status, status);

// Real browser path where autoplay is explicitly allowed.
const allowed = await chromium.launch({ ...chrome, args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await allowed.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url);
  await waitStatus(page, "playing");
  assert.equal(await page.locator(".invitation").getAttribute("data-audio-track"), "day1");
  assert.equal(await page.locator(".music-control").isVisible(), true);
  await page.locator(".music-control").click();
  await waitStatus(page, "off");
  await page.locator(".first-greeting h1").click();
  await page.locator("#day2").evaluate((e) => e.scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
  await page.reload();
  await waitStatus(page, "off");
  await page.locator(".music-control").click();
  await waitStatus(page, "playing");
  console.log("Chromium: real autoplay, always-available mute, no gesture re-enable, remembered mute and explicit resume passed");
} finally { await allowed.close(); }

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? chrome : {});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      // Emulate a strict autoplay policy deterministically in both browser engines.
      // Once a real gesture occurs, use the native media/context methods again.
      let gesture = false;
      for (const name of ["pointerdown", "touchend", "click", "keydown"])
        document.addEventListener(name, (event) => { if (event.isTrusted) gesture = true; }, true);
      const resume = AudioContext.prototype.resume;
      AudioContext.prototype.resume = function () {
        return gesture ? resume.call(this) : Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      };
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        return gesture ? play.call(this) : Promise.reject(new DOMException("Gesture required", "NotAllowedError"));
      };
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await waitStatus(page, "blocked");
    assert.equal(await page.locator(".invitation").getAttribute("data-music-enabled"), "true");
    assert.match(await page.locator(".music-control").innerText(), /音乐待播放/);
    assert.ok(!(await page.locator(".music-control").innerText()).includes("音乐已开"));
    await page.locator(".first-greeting h1").tap();
    await waitStatus(page, "playing");
    for (const [selector, track] of [[".world-transition", "transition"], ["#day2", "day2"], ["#party", "party"], ["#ending", "ending"], ["#info-summary", "ending"]]) {
      await page.locator(selector).evaluate((e) => e.scrollIntoView({ behavior: "instant" }));
      await page.waitForFunction((track) => {
        const app = document.querySelector(".invitation");
        return app.dataset.audioTrack === track && app.dataset.audioStatus === "playing";
      }, track);
    }
    await page.locator(".music-control").tap();
    await waitStatus(page, "off");
    await page.locator("#hello").evaluate((e) => e.scrollIntoView({ behavior: "instant" }));
    await page.locator(".first-greeting h1").tap();
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
    await page.reload({ waitUntil: "networkidle" });
    await waitStatus(page, "off");
    assert.deepEqual(errors, []);
    await page.close();

    // A guest can disable even a blocked autoplay attempt before touching the page.
    const blocked = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await blocked.addInitScript(() => {
      AudioContext.prototype.resume = () => new Promise(() => {});
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
    });
    await blocked.goto(url);
    await waitStatus(blocked, "blocked");
    await blocked.locator(".music-control").click();
    await waitStatus(blocked, "off");
    await blocked.locator(".first-greeting h1").click();
    assert.equal(await blocked.locator(".invitation").getAttribute("data-audio-status"), "off");
    await blocked.close();
    console.log(`${engine.name()}: blocked autoplay, gesture unlock, all scene tracks, cancellation and mute persistence passed`);
  } finally { await browser.close(); }
}
