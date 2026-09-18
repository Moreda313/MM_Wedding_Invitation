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
    for (const [width, height] of [[320, 568], [375, 812], [390, 844], [430, 932], [1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height },
        isMobile: width < 700, hasTouch: width < 700 });
      const errors = [], audio = [];
      await mutedSession(page);
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (request.url().endsWith(".mp3")) audio.push(request.url());
      });
      // Check clipboard behavior without changing the user's real clipboard.
      await page.addInitScript(() => {
        window.__copies = [];
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
          writeText: async (text) => {
            if (window.__copyFails) throw new Error("denied");
            window.__copies.push(text);
          },
        } });
      });
      await page.goto(url, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".greeting-frame").count(), 3);
      assert.ok(await page.locator(".greeting").evaluate((element) => element.offsetHeight < innerHeight * 3.3));
      const text = await page.locator("main").textContent();
      for (const obsolete of ["故事还没有结束", "一天，怎么够", "相聚的好天气", "一起开心两天", "下一章"])
        assert.ok(!text.includes(obsolete), obsolete);
      assert.match(await page.locator(".transition-copy h2").textContent(), /人生，也可以是星露谷。/);
      assert.equal(await page.locator(".transition-caption").textContent(), "把日子，过成喜欢的游戏。");
      await page.locator("#day1").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
      await page.locator('.day-nav a[href="#info-summary"]').click();
      await page.waitForFunction(() => {
        const target = document.querySelector("#info-summary").getBoundingClientRect();
        return target.top >= 0 && target.top < 85;
      });
      await page.waitForTimeout(800);
      assert.equal(await page.locator(".invitation").getAttribute("data-scene"), "ending");
      assert.equal(await page.locator(".summary-card").count(), 2);
      assert.equal(await page.locator("main > :last-child").getAttribute("id"), "info-summary");
      for (const [id, date, weekday, city, venue, address, map] of [
        ["day1", "2026.10.22", "星期四", "建德", "杭州新安雷迪森酒店", "建德市新安江街道南山路1号", "https://surl.amap.com/mzxjIZkp9A1"],
        ["day2", "2026.10.23", "星期五", "遂昌", "华侨东方大酒店", "遂昌县牡丹亭中路8号（近太和路）", "https://surl.amap.com/dCdJgKy170lF"],
      ]) {
        const card = page.locator(`.summary-${id}`);
        const copy = await card.innerText();
        for (const value of [date, weekday, city, venue, address]) assert.ok(copy.includes(value), value);
        assert.equal(await card.locator(".map-actions a").getAttribute("href"), map);
        const summaryRows = await card.locator(".summary-schedule > div").allTextContents();
        const sourceRows = await page.locator(`#${id}-info .schedule-row`).evaluateAll((rows) =>
          rows.map((row) => row.querySelector("span").textContent + row.querySelector("strong").textContent));
        assert.deepEqual(summaryRows, sourceRows);
        await card.locator("button").click();
        assert.equal(await card.locator('[role="status"]').textContent(), "地址已复制");
        assert.equal(await page.evaluate(() => window.__copies.at(-1)), `${city} · ${venue} ${address}`);
      }
      await page.evaluate(() => { window.__copyFails = true; });
      await page.locator(".summary-day2 button").click();
      assert.equal(await page.locator('.summary-day2 [role="status"]').textContent(), "请长按上方地址复制");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const nav = await page.locator(".day-nav").boundingBox();
      assert.ok(nav.x >= 0 && nav.x + nav.width <= width);
      assert.equal(audio.length, 0, "Summary navigation must not autoplay music");
      assert.deepEqual(errors, []);
      await page.locator("#info-summary").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
      await page.screenshot({ path: `test-results/${engine.name()}-${width}-summary.png` });
      await page.goto(`${url}#info-summary`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => document.querySelector(".invitation").dataset.openingStage === "invitation");
      console.log(`${engine.name()} ${width}: three-screen opening, copy, summary, maps, clipboard and navigation passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
