import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const engine = process.env.BROWSER_ENGINE || 'chromium';
const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const page = await browser.newPage({ viewport: { width:390, height:844 } });
  await page.addInitScript(() => {
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function () {
      return resume.call(this).then(() => new Promise(resolve => setTimeout(resolve, 300)));
    };
  });
  await page.goto(url, { waitUntil:'networkidle' });
  await page.evaluate(() => document.documentElement.style.scrollBehavior = 'auto');
  await page.locator('#day2').evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(300);
  await page.locator('.music-control').click();
  await page.locator('.music-control').click();
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.invitation').getAttribute('data-audio-status'), 'off', 'Turning off during audio unlock must stay off');
  await page.route('**/audio/flower-dance.mp3', route => route.fulfill({status:404,body:''}));
  await page.locator('.music-control').click();
  await page.waitForFunction(() => document.querySelector('.invitation').dataset.audioStatus === 'error');
  await page.unroute('**/audio/flower-dance.mp3');
  await page.locator('.music-control').click();
  await page.waitForFunction(() => document.querySelector('.invitation').dataset.audioTrack === 'day2');
  await page.route('**/audio/fall.mp3', async route => { await new Promise(resolve => setTimeout(resolve, 1200)); await route.continue(); });
  await page.locator('.world-transition').evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(250);
  await page.locator('#party').evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY));
  await page.waitForFunction(() => document.querySelector('.invitation').dataset.audioTrack === 'party');
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('.invitation').getAttribute('data-audio-track'), 'party', 'Late previous track must not take over after fast scrolling');
  console.log(`${engine}: audio unlock cancellation, failed-file retry and fast-scroll race passed`);
} finally { await browser.close(); }
