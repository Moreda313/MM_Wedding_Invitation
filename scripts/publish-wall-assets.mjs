import sharp from "sharp";
import assert from "node:assert/strict";
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

// Publish only the user's eleven approved, metadata-free web derivatives.
// Never copy the original ZIP, 25-photo review, or full-size JPEG previews.
const ids = ["01", "02", "03", "04", "15", "16", "18", "19", "22", "24", "25"];
const { photos } = JSON.parse(await readFile("photo-review/manifest.json", "utf8"));
const output = "public/assets/photos/wall";
await mkdir(output, { recursive: true });
let total = 0;
for (const id of ids) {
  const source = photos.find(photo => photo.id === id)?.variants.find(v => v.longEdge === 480);
  assert.ok(source, `Missing approved photo ${id}`);
  const input = join("photo-review", source.file);
  const metadata = await sharp(input).metadata();
  assert.ok(!metadata.exif && !metadata.xmp, "Strip private metadata before publishing");
  await copyFile(input, join(output, `wall-${id}.webp`));
  total += source.bytes;
}
assert.deepEqual((await readdir(output)).sort(), ids.map(id => `wall-${id}.webp`));
console.log(`Prepared exactly ${ids.length} approved images (${Math.round(total / 1024)} KB). Other personal photos remain local.`);
