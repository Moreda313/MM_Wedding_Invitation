import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const chrome = { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" };
const waitStatus = (page, status) => page.waitForFunction(value =>
  document.querySelector(".invitation").dataset.audioStatus === value, status);
const greeting = (page, fraction) => page.locator("#hello").evaluate((e, fraction) =>
  scrollTo({ top: (e.offsetHeight - innerHeight) * fraction, behavior: "instant" }), fraction);
async function instrument(page) {
  const requests = [];
  page.on("request", request => { if (request.url().includes("/audio/")) requests.push(request.url()); });
  await page.addInitScript(() => {
    window.__playAttempts = 0;
    window.__resumeAttempts = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { ++window.__playAttempts; return play.call(this); };
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function () { ++window.__resumeAttempts; return resume.call(this); };
    const media = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function (audio) { window.__rain = audio; return media.call(this, audio); };
  });
  return requests;
}
async function assertSilentOpening(page, requests) {
  await page.waitForTimeout(400);
  await waitStatus(page, "off");
  assert.equal(await page.locator(".music-shell").getAttribute("data-visible"), "false");
  assert.equal(await page.locator(".music-shell").evaluate(e => e.inert), true);
  assert.deepEqual(await page.evaluate(() => [window.__playAttempts, window.__resumeAttempts]), [0, 0]);
  assert.ok(requests.some(url => url.includes("rain-intro-v2.mp3")), "Rain downloads during the silent opening");
}

const allowed = await chromium.launch({ ...chrome, args: ["--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await allowed.newPage({ viewport: { width: 390, height: 844 } });
  const requests = await instrument(page);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".first-greeting h1").click();
  await assertSilentOpening(page, requests);
  await greeting(page, .5);
  await page.waitForTimeout(1100);
  await page.locator(".greeting-frame.is-current h1").click();
  await assertSilentOpening(page, requests);
  await greeting(page, .749);
  await assertSilentOpening(page, requests);
  await greeting(page, .85);
  await waitStatus(page, "playing");
  assert.equal(await page.locator(".invitation").getAttribute("data-opening-stage"), "announcement");
  assert.equal(await page.locator(".invitation").getAttribute("data-audio-track"), "day1");
  assert.equal(await page.locator(".music-shell").getAttribute("data-visible"), "true");
  await page.waitForFunction(() => window.__rain.currentTime > .1);
  await greeting(page, .1);
  await waitStatus(page, "off");
  await page.waitForFunction(() => window.__rain.paused);
  assert.equal(await page.locator(".invitation").getAttribute("data-music-enabled"), "true");
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
  await greeting(page, .85);
  await waitStatus(page, "playing");
  await page.locator(".music-control").click();
  await waitStatus(page, "off");
  await greeting(page, .1);
  await page.locator(".first-greeting h1").click();
  await greeting(page, .85);
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
  await page.reload({ waitUntil: "domcontentloaded" });
  await greeting(page, .85);
  await page.waitForTimeout(500);
  await waitStatus(page, "off");
  await page.locator(".music-control").click();
  await waitStatus(page, "playing");
  console.log("Chromium: silent first two greetings (including taps), Rain at announcement, silence on return, foreground safety and remembered mute passed");
} finally { await allowed.close(); }

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? chrome : {});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const requests = await instrument(page);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      let gesture = false;
      for (const name of ["pointerdown", "touchend", "click", "keydown"])
        document.addEventListener(name, event => { if (event.isTrusted) gesture = true; }, true);
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
    await assertSilentOpening(page, requests);
    await greeting(page, .85);
    await waitStatus(page, "blocked");
    assert.match(await page.locator(".music-control").innerText(), /音乐待播放/);
    // A physical viewport tap must not auto-scroll a sticky frame (WebKit's
    // locator.scrollIntoView can move this scroll-driven sequence backwards).
    await page.waitForTimeout(1100);
    await page.touchscreen.tap(120, 350);
    await waitStatus(page, "playing");
    for (const [selector, track] of [[".world-transition", "transition"], ["#day2", "day2"], ["#party", "party"], ["#memory-wall", "party"], ["#ending", "ending"], ["#info-summary", "ending"]]) {
      await page.locator(selector).evaluate(e => e.scrollIntoView({ behavior: "instant" }));
      await page.waitForFunction(track => {
        const app = document.querySelector(".invitation");
        return app.dataset.audioTrack === track && app.dataset.audioStatus === "playing";
      }, track);
    }
    await greeting(page, 0);
    await waitStatus(page, "off");
    await page.waitForFunction(() => window.__rain.paused);
    await greeting(page, .85);
    await waitStatus(page, "playing");
    await page.locator(".music-control").tap();
    await waitStatus(page, "off");
    await greeting(page, 0);
    await page.locator(".first-greeting h1").tap();
    await greeting(page, .85);
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
    assert.deepEqual(errors, []);
    await page.close();

    const blocked = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await blocked.addInitScript(() => {
      AudioContext.prototype.resume = () => new Promise(() => {});
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
    });
    await blocked.goto(url);
    await greeting(blocked, .85);
    await waitStatus(blocked, "blocked");
    await blocked.locator(".music-control").click();
    await waitStatus(blocked, "off");
    await blocked.locator(".announcement-greeting h1").click();
    await waitStatus(blocked, "off");
    await blocked.close();

    const direct = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const directRequests = await instrument(direct);
    await direct.goto(`${url}#party`, { waitUntil: "domcontentloaded" });
    await direct.waitForFunction(() => document.querySelector(".invitation").dataset.scene === "party");
    await direct.mouse.click(100, 220);
    await direct.waitForFunction(() => {
      const app = document.querySelector(".invitation");
      return app.dataset.audioTrack === "party" && app.dataset.audioStatus === "playing";
    });
    assert.equal(await direct.locator(".invitation").getAttribute("data-audio-track"), "party");
    assert.ok(!directRequests.some(u => u.includes("rain-intro-v2.mp3")), "Direct links must not briefly start Rain");
    await direct.close();

    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const reducedRequests = await instrument(reduced);
    await reduced.goto(url, { waitUntil: "networkidle" });
    await reduced.locator(".first-greeting h1").click();
    await assertSilentOpening(reduced, reducedRequests);
    await reduced.locator(".announcement-greeting").evaluate(e => scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight * .4, behavior: "instant" }));
    await reduced.locator(".announcement-greeting h1").click();
    await waitStatus(reduced, "playing");
    await reduced.close();
    console.log(`${engine.name()}: gesture fallback, all scene tracks, mute while blocked, direct links and reduced-motion announcement passed`);
  } finally { await browser.close(); }
}
