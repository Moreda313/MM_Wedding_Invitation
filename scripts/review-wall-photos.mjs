import { readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const folder = resolve("photo-review");
const { photos } = JSON.parse(await readFile(join(folder, "manifest.json"), "utf8"));
const picks = JSON.parse(await readFile(join(folder, "selection.json"), "utf8"));
const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const selected = picks.map(pick => {
  const photo = photos.find(photo => photo.id === pick.id);
  if (!photo) throw new Error(`Missing photo ${pick.id}`);
  return { ...photo, ...pick };
});
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>推荐选片 · 8 张合照</title><style>
*{box-sizing:border-box}body{margin:0;padding:32px;background:#f7f5ef;color:#30372f;font:15px/1.7 -apple-system,"PingFang SC",sans-serif}header{display:flex;align-items:baseline;justify-content:space-between;gap:20px}h1{font-size:26px;margin:0;font-weight:600}header span{color:#6d7766}header+p{margin:8px 0 24px;color:#6d7766}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}figure{margin:0;background:#fffdfa;padding:12px;border:1px solid #e2e2d7}a{color:inherit;text-decoration:none}img{width:100%;height:266px;object-fit:contain;display:block;background:#efeee8}.caption{display:flex;gap:10px;align-items:baseline;margin-top:10px}.number{font:600 24px/1.5 system-ui;color:#52664e}.title{font-weight:600}.source{display:block;font-size:12px;color:#6d7766}.reason{font-size:13px;line-height:1.7;margin:8px 0 0;min-height:44px;color:#626c5c}.main{border-top:3px solid #52664e;padding-top:10px}footer{margin-top:22px;color:#6d7766;font-size:13px}@media(max-width:800px){body{padding:18px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}img{height:230px}header{display:block}h1{font-size:23px}}
</style><header><h1>下一张，和你一起。</h1><span>推荐选片 · 8 / 25</span></header><p>19、20 号建议稍大，其余照片错落搭配。这是选片预览，还不是最终照片墙排版。</p><div class="grid">${selected.map(photo => `<figure class="${photo.role === "主照片" ? "main" : ""}"><a href="${photo.preview}"><img src="${photo.preview}" alt="${escape(photo.title)}"><div class="caption"><span class="number">${photo.id}</span><div><span class="title">${escape(photo.title)}</span><span class="source">${escape(photo.source)}</span></div></div></a><p class="reason">${escape(photo.reason)}</p></figure>`).join("")}</div><footer>全部保留原始构图与真实色彩，仅做方向校正、尺寸适配和网页压缩。候选照片只存本地，尚未上传网站。<br><a href="index.html">查看全部 25 张候选 →</a></footer></html>`;
await writeFile(join(folder, "shortlist.html"), html);
await writeFile(join(folder, "选片说明.md"), `# 合照选片（待确认）\n\n全部 ${photos.length} 张照片已处理。原片保留在根目录的合照.zip；此目录不提交 Git、不部署。\n\n- optimized/：480、960、1440 像素长边的 WebP，质量 88，保持完整构图，移除 EXIF / GPS 元数据。\n- previews/：1440 像素长边的 JPEG 预览。\n- index.html：全部 25 张本地预览。\n- contact-sheet-1.jpg 至 contact-sheet-3.jpg：全部照片编号总览。\n- shortlist.jpg / shortlist.html：推荐的 8 张；仅选片，不是照片墙定稿。\n- manifest.json：编号与原文件名、尺寸、大小对应表。\n\n## 推荐照片\n\n${selected.map(photo => `- **${photo.id} · ${photo.title}**（${photo.source}）：${photo.reason}`).join("\n")}\n\n备选：05（海边俏皮动作），10（圆镜合影，构图有趣但缩小后人物较小），06（岩洞框景，适合留一张较大的竖图）。最终以你确认的编号为准。\n`);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(folder, "shortlist.html")).href);
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: join(folder, "shortlist.jpg"), fullPage: true, type: "jpeg", quality: 94 });
  await page.setViewportSize({ width: 390, height: 844 });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error("Mobile review overflow");
  console.log(`Selected ${selected.map(photo => photo.id).join(", ")}; preview created, all eight images decoded.`);
} finally { await browser.close(); }
