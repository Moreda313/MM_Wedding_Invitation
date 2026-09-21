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
      const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 700, hasTouch: width < 700 });
      await mutedSession(page);
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      page.on("response", r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: "networkidle" });
      const text = await page.locator("main").textContent();
      for (const old of ["等等，似乎", "想玩什么", "不用全部打卡", "种出来了，记得发照片", "点选感兴趣", "杭州新安", "查看大图", "具体钟点待补充", "和你们一起"])
        assert.ok(!text.includes(old), old);
      assert.deepEqual(await page.locator(".greeting-emoji").allTextContents(), ["👋", "💌", "🎉"]);
      assert.equal(await page.locator(".greeting-frame:not(.announcement-greeting) img").count(), 0);
      assert.equal(await page.locator("#party h2").innerText(), "在一起，\n享受秋日时光。");
      assert.equal(await page.locator(".venue-photo a").count(), 0);
      assert.match(await page.locator('#day1-info .venue-block h3').innerText(), /^新安江雷迪森酒店$/);
      for (const [id, times] of [["day1", ["上午9:00", "下午14:00", "晚上17:30"]], ["day2", ["中午11:00", "下午14:00"]]]) {
        assert.deepEqual(await page.locator(`#${id}-info .schedule-row > span`).allTextContents(), times);
        assert.deepEqual(await page.locator(`.summary-${id} .summary-schedule dt`).allTextContents(), times);
        for (const selector of [`#${id}-info .schedule-row`, `.summary-${id} .summary-schedule > div`])
          assert.ok(await page.locator(selector).evaluateAll(rows => rows.every(row => {
            const [time, details] = [...row.children].map(e => e.getBoundingClientRect());
            return time.right <= details.left && details.width >= 100;
          })), "Long time labels must not overlap the activity titles");
      }
      await page.locator(".greeting").evaluate(e => scrollTo({ top: (e.offsetHeight - innerHeight) * .9, behavior: "instant" }));
      await page.waitForTimeout(1100);
      assert.ok(await page.locator(".announcement-greeting").evaluate(e => getComputedStyle(e).opacity === "1"));
      assert.equal(await page.locator(".celebration-emoji").textContent(), "🎉");
      await page.locator(".greeting-bouquet img").evaluate(e => e.decode());
      await page.screenshot({ path: `test-results/${engine.name()}-${width}-announcement.png` });
      for (const [id, lawn] of [["day1", "雷迪森酒店草坪"], ["day2", "遂昌源口大草坪"]]) {
        assert.ok(await page.locator(`#${id}-info`).evaluate(e => {
          const children = [...e.children];
          return children[0].classList.contains("info-heading") && children[1].classList.contains("venue-photo")
            && children.indexOf(e.querySelector(".invitation-card")) > 1;
        }), "Title → venue image → date/place/schedule");
        assert.equal(await page.locator(`#${id}-info .live-note`).count(), 0);
        assert.equal(await page.locator(`#${id}-info figcaption`).textContent(), `婚礼场地${lawn}`);
        assert.match(await page.locator(`.summary-${id} .summary-lawn`).innerText(), new RegExp(lawn));
      }
      assert.match(await page.locator("#day2-info .schedule").innerText(), /14:00\s+草坪婚礼与派对\s+遂昌源口大草坪/);
      assert.match(await page.locator(".summary-day2 .summary-schedule").innerText(), /14:00\s+草坪婚礼与派对/);
      for (const selector of ["#day2-info", ".summary-day2"]) {
        const link = page.locator(`${selector} .map-actions a`);
        assert.equal((await link.innerText()).replace("↗", "").trim(), selector === "#day2-info" ? "午宴酒店地图" : "打开地图");
        assert.equal(await link.getAttribute("href"), "https://surl.amap.com/dCdJgKy170lF");
      }
      await page.locator(".town-map").evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
      // WebKit may abort decode() while activating lazy images after a jump.
      // Wait for the final visible source, and still fail on broken images.
      await page.waitForFunction(() => [...document.querySelectorAll(".map-autumn img, .map-tree img")]
        .every(image => image.complete && image.naturalWidth > 0));
      assert.equal(await page.locator(".map-autumn img, .map-tree img").count(), 19);
      assert.match(await page.locator('[data-activity="music"] img').getAttribute("src"), /Flute_Block\.png$/);
      await page.waitForTimeout(900);
      for (const stop of await page.locator(".map-stop").all()) {
        // The map is taller than a 320px phone's viewport. Center each control
        // before hit-testing, so fixed header/footer navigation is excluded.
        await stop.evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
        assert.ok(await stop.evaluate(e => {
          const r = e.getBoundingClientRect();
          return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        }), "Decorations must never intercept a tap");
        await stop.click();
        assert.equal(await stop.getAttribute("aria-pressed"), null);
      }
      await page.locator(".town-map").evaluate(e => e.scrollIntoView({ behavior: "instant", block: "center" }));
      await page.screenshot({ path: `test-results/${engine.name()}-${width}-autumn-map.png` });
      await page.locator(".seed-note").scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const image = document.querySelector('.seed-icons img[src$="Stardrop.png"]');
        return image.complete && image.naturalWidth > 0;
      });
      assert.match(await page.locator(".seed-note").innerText(), /带一份种子回家，\s*让美好慢慢生长。/);
      assert.equal(await page.locator(".party-footnote").count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`${engine.name()} ${width}: celebration, image order, two venues, 14:00, autumn assets and all nine activity taps passed`);
    }
  } finally { await browser.close(); }
}
