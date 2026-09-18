import sharp from "sharp";
import { mkdir } from "node:fs/promises";

await mkdir("public/assets/photos", { recursive: true });
for (const day of [1, 2]) {
  for (const width of [640, 960, 1440]) {
    const result = await sharp(`day${day}_place.png`)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(`public/assets/photos/day${day}-place-${width}.webp`);
    console.log(`Day ${day}: ${result.width}×${result.height}, ${(result.size / 1024).toFixed(0)} KB`);
  }
}
