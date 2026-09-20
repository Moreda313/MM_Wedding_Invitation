import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await mkdir("public/assets/photos", { recursive: true });
const onlyDay = process.argv.find(arg => arg.startsWith("--day="))?.split("=")[1];
if (onlyDay && !["1", "2"].includes(onlyDay)) throw new Error("Use --day=1 or --day=2");
for (const day of onlyDay ? [Number(onlyDay)] : [1, 2]) {
  // Each changed venue illustration gets new URLs, including in browser caches.
  const revision = `-${createHash("sha256").update(await readFile(`day${day}_place.png`)).digest("hex").slice(0, 8)}`;
  for (const width of [640, 960, 1440]) {
    const result = await sharp(`day${day}_place.png`)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(`public/assets/photos/day${day}-place${revision}-${width}.webp`);
    console.log(`day${day}-place${revision}-${width}.webp: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(0)} KB`);
  }
}
