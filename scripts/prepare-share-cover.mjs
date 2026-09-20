import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const source = await readFile("cover.png");
const revision = createHash("sha256").update(source).digest("hex").slice(0, 8);
await mkdir("public/assets/share", { recursive: true });
const path = `public/assets/share/cover-${revision}.jpg`;
// Preserve the entire supplied composition. JPEG is broadly supported by crawlers.
const result = await sharp(source).rotate().resize({ width: 1200, withoutEnlargement: true })
  .jpeg({ quality: 88, mozjpeg: true }).toFile(path);
console.log(`${path}: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(0)} KB`);
console.log("Update index.html image URLs and dimensions if the source changes.");
