import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";

// First design proof only. The live React invitation and public/ stay unchanged.
const folder = resolve("photo-review/photo-wall");
await mkdir(join(folder, "photos"), { recursive: true });
await mkdir(join(folder, "pixel"), { recursive: true });
const { photos } = JSON.parse(await readFile("photo-review/manifest.json", "utf8"));
const layout = [
  { id: "01", x: 23, y: 37, w: 201, angle: -6, ratio: "16/9", fix: "pin", pin: "#839474", alt: "海边喝饮料的合照" },
  { id: "02", x: 380, y: 47, w: 192, angle: -3, ratio: "16/9", fix: "tape", alt: "绿山与海岸前的合照" },
  { id: "03", x: 240, y: 22, w: 126, angle: 4, ratio: "3/4", fix: "pin", pin: "#c7a266", alt: "花丛旁的夜间合照" },
  { id: "04", x: 589, y: 36, w: 133, angle: 6, ratio: "3/4", fix: "pin", pin: "#87999b", alt: "草地上放彩色风筝" },
  { id: "15", x: 27, y: 226, w: 221, angle: 4, ratio: "16/9", fix: "tape tape-warm", alt: "树荫下并肩坐着，身后是山与城市" },
  { id: "16", x: 268, y: 239, w: 128, angle: -7, ratio: "4/5", position: "50% 85%", fix: "pin", pin: "#9aa27c", alt: "夕阳下靠在一起的近景" },
  { id: "18", x: 278, y: 429, w: 128, angle: 3, ratio: "4/5", position: "50% 60%", fix: "tape", alt: "木亭里相对而坐" },
  { id: "19", x: 420, y: 235, w: 247, angle: -4, ratio: "16/9", fix: "pin", pin: "#b07c6b", alt: "金色草地与秋日夕阳中的合照" },
  { id: "22", x: 30, y: 423, w: 220, angle: -5, ratio: "16/9", fix: "pin", pin: "#a39564", alt: "海边日落，笑容和举手比心" },
  { id: "24", x: 430, y: 427, w: 179, angle: 7, ratio: "16/9", fix: "tape tape-warm", alt: "蓝天海边的双人站姿合照" },
  { id: "25", x: 552, y: 492, w: 181, angle: -6, ratio: "16/9", fix: "pin", pin: "#839474", layer: 3, alt: "晴天沙滩上的合照" },
];
const expectedIds = ["01", "02", "03", "04", "15", "16", "18", "19", "22", "24", "25"];
assert.deepEqual(layout.map(p => p.id), expectedIds);
let bytes = 0;
for (const item of layout) {
  const photo = photos.find(photo => photo.id === item.id);
  assert.ok(photo, `Missing selected photo ${item.id}`);
  const variant = photo.variants.find(v => v.longEdge === 480);
  await copyFile(join("photo-review", variant.file), join(folder, "photos", `wall-${item.id}.webp`));
  bytes += variant.bytes;
}
const sprites = ["Stardrop", "White_Chicken", "Fairy_Rose", "Oak_Fall", "Junimo_Icon", "Pumpkin", "Acorn"];
for (const name of sprites) await copyFile(`public/assets/pixel/${name}.png`, join(folder, "pixel", `${name}.png`));
await copyFile("scripts/templates/photo-wall-preview.css", join(folder, "wall.css"));
const markup = layout.map(item => {
  const variant = photos.find(p => p.id === item.id).variants.find(v => v.longEdge === 480);
  return `<figure class="snapshot ${item.fix}" data-photo="${item.id}" style="--x:${item.x};--y:${item.y};--w:${item.w};--angle:${item.angle}deg;--ratio:${item.ratio};--position:${item.position || "center"};--pin:${item.pin || "#8b9a6c"};--layer:${item.layer || 2}"><img src="photos/wall-${item.id}.webp" alt="${item.alt}" width="${variant.width}" height="${variant.height}"></figure>`;
}).join("\n");
const template = await readFile("scripts/templates/photo-wall-preview.html", "utf8");
await writeFile(join(folder, "index.html"), template.replace("<!-- WALL_PHOTOS -->", markup));
await writeFile(join(folder, "layout.json"), JSON.stringify({ selectedIds: expectedIds, crop: "16、18 号以 CSS 做 4:5 展示裁切，其余保留原始比例。原片不改。", layout }, null, 2));
await writeFile(join(folder, "说明.md"), `# 照片墙第一版（待确认）\n\n使用用户指定的 11 张：${expectedIds.join("、")}。此前 shortlist 的 8 张推荐不再作为本版选片依据。\n\n- 打开 index.html 查看独立预览，或运行本地静态服务器。\n- photo-wall-mobile.png / photo-wall-large.png：手机效果图与较大效果图。\n- layout.json：照片编号、布局、旋转角度及展示裁剪配置。\n- 16、18 号用 CSS 做 4:5 展示裁剪；其他照片保留完整比例，原片与之前生成的候选照片均未覆盖。\n- photos/ 仅包含这 11 张经压缩、移除 EXIF 的 480 像素长边 WebP，合计约 ${Math.round(bytes / 1024)} KB。\n- 预览资源全部放在此目录，可直接迁移；正式网站源码与 public/ 未改，尚未发布。\n`);
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch(engine === chromium ? { executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" } : {});
  try {
    for (const [width, height] of [[320, 700], [390, 844], [430, 932], [1200, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: width < 700 ? 2 : 1 });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(pathToFileURL(join(folder, "index.html")).href);
      await page.evaluate(() => document.fonts.ready);
      await page.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert.deepEqual(await page.locator(".snapshot").evaluateAll(elements => elements.map(e => e.dataset.photo)), expectedIds);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
      if (width < 700) assert.ok((await page.locator(".wall-board").boundingBox()).height < 365, "Compact mobile wall");
      assert.deepEqual(errors, []);
      await page.screenshot({ path: join(folder, `${engine.name()}-${width}.png`), fullPage: true });
      if (engine === chromium && width === 390) await page.locator(".memory-wall").screenshot({ path: join(folder, "photo-wall-mobile.png") });
      if (engine === chromium && width === 1200) await page.locator(".memory-wall").screenshot({ path: join(folder, "photo-wall-large.png") });
      console.log(`${engine.name()} ${width}: all 11 selected photos, crops, sprites and compact layout passed`);
      await page.close();
    }
  } finally { await browser.close(); }
}
console.log(`Preview: ${folder}/index.html; photo transfer: ${(bytes / 1024).toFixed(0)} KB. Nothing published.`);
