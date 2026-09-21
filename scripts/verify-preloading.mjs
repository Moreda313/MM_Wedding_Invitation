import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:4176/";
const music = ["rain-intro-v2.mp3", "fall-loop-v2.mp3", "flower-dance-loop-v2.mp3", "pelican-town-loop-v2.mp3", "moonlight-jellies-loop-v2.mp3"];
const chapter = async (page, selector, scene) => {
  await page.locator(selector).evaluate(e => e.scrollIntoView({ behavior: "instant" }));
  await page.waitForFunction(scene => {
    const app = document.querySelector(".invitation");
    return app.dataset.audioStatus === "playing" && app.dataset.audioTrack === scene;
  }, scene);
};
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium
    ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--autoplay-policy=no-user-gesture-required"] } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.addInitScript(() => {
      window.__media = [];
      window.__starts = [];
      window.__plays = 0;
      window.__resumes = 0;
      const load = HTMLMediaElement.prototype.load;
      HTMLMediaElement.prototype.load = function () {
        if (this.src.includes("rain-intro")) window.__media.push(this);
        return load.call(this);
      };
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { window.__plays++; return play.call(this); };
      const resume = AudioContext.prototype.resume;
      AudioContext.prototype.resume = function () { window.__resumes++; return resume.call(this); };
      const create = AudioContext.prototype.createBufferSource;
      AudioContext.prototype.createBufferSource = function () {
        const source = create.call(this), start = source.start.bind(source);
        source.start = (...args) => {
          window.__starts.push({ source, offset: args[1] || 0, ended: false });
          const record = window.__starts.at(-1);
          source.addEventListener("ended", () => { record.ended = true; });
          return start(...args);
        };
        return source;
      };
    });
    const requests = [], errors = [];
    page.on("request", r => { if (r.url().includes("/audio/")) requests.push(r.url().split("/").at(-1)); });
    page.on("pageerror", e => errors.push(e.message));
    // Critical photo delivery wins over speculative audio downloads.
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route("**/couple-*.webp", async route => { await gate; await route.continue(); });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    assert.equal(requests.length, 0, "Do not compete with the initial portrait download");
    release();
    await page.waitForLoadState("load");
    await page.waitForFunction(() => window.__media[0]?.readyState >= 3);
    await page.waitForFunction(() => [...document.querySelectorAll(".day-two img, #memory-wall img")].every(i => i.complete && i.naturalWidth));
    await page.waitForLoadState("networkidle");
    for (const file of music) assert.ok(requests.includes(file), `Warm ${file} before visiting its chapter`);
    assert.deepEqual(await page.evaluate(() => [window.__plays, window.__resumes]), [0, 0]);
    assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
    assert.ok(await page.evaluate(() => window.__media[0].paused && window.__media[0].currentTime === 0));
    await page.locator("#hello").evaluate(e => scrollTo({ top: (e.offsetHeight - innerHeight) * .85, behavior: "instant" }));
    await page.waitForTimeout(1100);
    await page.touchscreen.tap(120, 350);
    await page.waitForFunction(() => document.querySelector(".invitation").dataset.audioStatus === "playing");
    assert.equal(await page.evaluate(() => window.__media.length), 1, "Playback reuses the prefetched Rain element");
    await page.waitForFunction(() => window.__media[0].currentTime > .2);
    await page.evaluate(() => { const rain = window.__media[0]; rain.currentTime = rain.duration - .15; });
    await page.waitForFunction(() => window.__media[0].currentTime < 1);
    assert.ok(await page.evaluate(() => window.__media[0].loop && !window.__media[0].paused));
    await chapter(page, "#day2", "day2");
    await page.waitForTimeout(1200);
    await page.locator(".music-control").tap();
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
    await page.locator(".music-control").tap();
    await page.waitForFunction(() => document.querySelector(".invitation").dataset.audioStatus === "playing");
    assert.ok(await page.evaluate(() => window.__starts.at(-1).offset >= 1), "Manual resume preserves the instrumental position");
    for (const [selector, scene] of [[".world-transition", "transition"], ["#day2", "day2"], ["#party", "party"], ["#ending", "ending"]]) {
      await chapter(page, selector, scene);
      assert.ok(await page.evaluate(() => { const node = window.__starts.at(-1).source; return node.loop && node.buffer.duration < 60; }));
    }
    // Cross the end of the short ending track quickly; the same node must loop.
    await page.evaluate(() => window.__starts.at(-1).source.playbackRate.value = 32);
    await page.waitForTimeout(2100);
    assert.ok(await page.evaluate(() => !window.__starts.at(-1).ended));
    for (const file of music.slice(1)) assert.equal(requests.filter(f => f === file).length, 1, `No second download for ${file}`);
    await page.locator(".music-control").tap();
    await page.locator("#party").evaluate(e => e.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".invitation").getAttribute("data-audio-status"), "off");
    assert.deepEqual(errors, []);
    console.log(`${engine.name()}: page-first preload, silent greeting, all upcoming assets, cache reuse, natural loops and pause/resume passed`);
    await page.close();
  } finally { await browser.close(); }
}
