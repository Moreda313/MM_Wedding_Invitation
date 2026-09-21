import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const source = await readFile("cover-share-v2.png");
const jpeg = await sharp(source).rotate().resize({ width: 1200, height: 630, fit: "cover" })
  .jpeg({ quality: 88, mozjpeg: true }).toBuffer();
const revision = createHash("sha256").update(jpeg).digest("hex").slice(0, 8);
await mkdir("public/assets/share", { recursive: true });
const path = `public/assets/share/wedding-cover-${revision}.jpg`;
await writeFile(path, jpeg);
// A stable download URL is convenient; metadata uses the versioned URL.
await writeFile("public/assets/share/wedding-cover.jpg", jpeg);
console.log(`${path}: 1200×630, ${(jpeg.length / 1024).toFixed(0)} KB`);
console.log("Update index.html image URLs and dimensions if the source changes.");
