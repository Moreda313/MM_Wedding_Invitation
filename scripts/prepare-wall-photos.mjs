import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";

// Local review only: unapproved personal photos must not enter public/ or Git.
// Originals remain in their ZIP; resize derivatives retain the whole frame.
const archive = resolve("合照.zip");
const output = resolve("photo-review");
const digest = async () => createHash("sha256").update(await readFile(archive)).digest("hex");
const originalDigest = await digest();
const entries = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n");
if (entries.some(entry => entry.startsWith("/") || entry.split("/").includes(".."))) {
  throw new Error("Unsafe archive entry");
}
const temp = await mkdtemp(join(tmpdir(), "mm-photo-review-"));
execFileSync("ditto", ["-x", "-k", archive, temp]);
await mkdir(join(output, "optimized"), { recursive: true });
await mkdir(join(output, "previews"), { recursive: true });
async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "__MACOSX") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(path));
    else if (/\.(jpe?g|png|heic|heif)$/i.test(entry.name)) files.push(path);
  }
  return files;
}
const files = (await collect(temp)).sort((a, b) => basename(a).localeCompare(basename(b), "en", { numeric: true }));
const photos = [];
for (const [index, source] of files.entries()) {
  const id = String(index + 1).padStart(2, "0");
  let input = source;
  if (/\.hei[cf]$/i.test(extname(source))) {
    // macOS decodes HEIC natively. PNG is a lossless intermediate, not another JPEG generation.
    input = join(temp, `decoded-${id}.png`);
    execFileSync("sips", ["-s", "format", "png", source, "--out", input], { stdio: "pipe" });
  }
  const metadata = await sharp(input).metadata();
  const variants = [];
  for (const edge of [480, 960, 1440]) {
    const file = `optimized/wall-${id}-${edge}.webp`;
    const info = await sharp(input).rotate().toColourspace("srgb")
      .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88, effort: 5 }).toFile(join(output, file));
    const check = await sharp(join(output, file)).metadata();
    if (check.exif || check.xmp) throw new Error(`Unexpected private metadata: ${file}`);
    variants.push({ file, longEdge: edge, width: info.width, height: info.height, bytes: info.size });
  }
  const preview = `previews/wall-${id}.jpg`;
  await sharp(input).rotate().toColourspace("srgb")
    .resize({ width: 1440, height: 1440, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 91, mozjpeg: true }).toFile(join(output, preview));
  photos.push({ id, source: basename(source), sourceSize: { width: metadata.width, height: metadata.height }, preview, variants });
  console.log(`${id} ${basename(source)} → ${variants[1].width}×${variants[1].height}, ${Math.round(variants[1].bytes / 1024)} KB`);
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
for (let offset = 0; offset < photos.length; offset += 9) {
  const page = photos.slice(offset, offset + 9);
  const composites = [];
  for (const [index, photo] of page.entries()) {
    const x = 20 + (index % 3) * 400;
    const y = 20 + Math.floor(index / 3) * 390;
    const thumb = await sharp(join(output, photo.preview))
      .resize({ width: 380, height: 330, fit: "contain", background: "#eeece6" }).toBuffer();
    composites.push({ input: thumb, left: x, top: y });
    const label = `<svg width="380" height="40"><text x="6" y="27" font-family="Arial, sans-serif" font-size="19" fill="#30372f">${photo.id} · ${escape(photo.source)}</text></svg>`;
    composites.push({ input: Buffer.from(label), left: x, top: y + 332 });
  }
  await sharp({ create: { width: 1220, height: 20 + Math.ceil(page.length / 3) * 390, channels: 3, background: "#f7f5ef" } })
    .composite(composites).jpeg({ quality: 92 }).toFile(join(output, `contact-sheet-${Math.floor(offset / 9) + 1}.jpg`));
}
await writeFile(join(output, "manifest.json"), JSON.stringify({ archive: basename(archive), sha256: originalDigest, photos }, null, 2) + "\n");
await writeFile(join(output, "index.html"), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>合照选片 · 本地预览</title><style>body{margin:0;padding:24px;background:#f7f5ef;color:#30372f;font:16px/1.8 system-ui}h1{font-size:26px}p{max-width:760px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}figure{margin:0;background:#eeece6;padding:12px}img{display:block;width:100%;height:300px;object-fit:contain}figcaption{font-size:14px;margin-top:8px}a{color:inherit}</style><h1>合照选片 · ${photos.length} 张</h1><p>编号与原文件名一一对应。所有照片保留完整构图，未修脸、未加滤镜。点击照片可查看较大预览；此页面只在本地使用，不属于正式请柬。</p><div class="grid">${photos.map(photo => `<figure><a href="${photo.preview}"><img src="${photo.preview}" loading="lazy" alt="合照 ${photo.id}"></a><figcaption><strong>${photo.id}</strong> · ${escape(photo.source)}</figcaption></figure>`).join("")}</div></html>`);
if (await digest() !== originalDigest) throw new Error("Original archive changed");
console.log(`Prepared ${photos.length} photos in ${output}; original ZIP unchanged. Nothing published.`);
