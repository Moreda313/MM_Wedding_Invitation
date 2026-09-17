import sharp from "sharp";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

// Originals stay untouched. Only generated web assets go into public/.
await mkdir("public/assets/photos", { recursive: true });
await mkdir("public/assets/pixel", { recursive: true });
await mkdir("public/audio", { recursive: true });
if (!process.argv.includes("--wiki-only")) {
  const temp = await mkdtemp(join(tmpdir(), "mm-wedding-"));
  execFileSync("unzip", ["-q", "海报.zip", "-d", temp]);
  const portrait = join(temp, "海报", "0O5A6751海报.jpg");
  for (const width of [640, 960, 1440]) {
    await sharp(portrait)
      .rotate()
      .resize({ width })
      .webp({ quality: 86 })
      .toFile(`public/assets/photos/couple-${width}.webp`);
  }
  for (const width of [96, 48, 24]) {
    await sharp(portrait)
      .rotate()
      .resize({ width })
      .webp({ lossless: true })
      .toFile(`public/assets/photos/pixel-${width}.webp`);
  }
  const { width, height } = await sharp("星露谷.png").metadata();
  // Remove the large English sign; keep the flower arch, couple and animals.
  const scene = {
    left: 0,
    top: Math.round(height * 0.315),
    width,
    height: Math.round(height * 0.49),
  };
  await sharp("星露谷.png")
    .extract(scene)
    .webp({ quality: 93 })
    .toFile("public/assets/pixel/wedding-scene.webp");
  await sharp("星露谷.png")
    .webp({ quality: 92 })
    .toFile("public/assets/pixel/wedding-poster.webp");
  const audio = {
    "rain.mp3": "rain.mp3",
    "21. Fall (Ghost Synth).mp3": "fall.mp3",
    "09. Flower Dance.mp3": "flower-dance.mp3",
    "08. Pelican Town.mp3": "pelican-town.mp3",
    "19. Dance Of The Moonlight Jellies.mp3": "moonlight-jellies.mp3",
  };
  for (const [source, name] of Object.entries(audio)) {
    const trim =
      name === "fall.mp3"
        ? ["-t", "24", "-af", "afade=t=in:st=0:d=1,afade=t=out:st=22:d=2"]
        : [];
    execFileSync(ffmpeg, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      source,
      ...trim,
      "-map_metadata",
      "-1",
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      name === "rain.mp3" ? "128k" : "160k",
      "-ar",
      "44100",
      `public/audio/${name}`,
    ]);
  }
}

if (process.argv.includes("--wiki") || process.argv.includes("--wiki-only")) {
  const names = [
    "Coffee",
    "Beer",
    "Ice_Cream",
    "Sunfish",
    "Bouquet",
    "Mixed_Seeds",
    "Golden_Pumpkin",
    "Drum_Block",
    "Acorn",
    "White_Chicken",
    "Junimo_Icon",
  ];
  const sources = [];
  for (const name of names) {
    try {
      const page = ["White_Chicken", "Junimo_Icon"].includes(name)
        ? "https://zh.stardewvalleywiki.com/Stardew_Valley_Wiki"
        : `https://stardewvalleywiki.com/${name}`;
      const html = await (await fetch(page)).text();
      const match = html.match(
        new RegExp(
          `(?:https://stardewvalleywiki.com)?(/mediawiki/images/[a-f0-9]/[a-f0-9]{2}/${name}\\.png)`,
        ),
      );
      if (!match) {
        console.warn(`No image found: ${name}`);
        continue;
      }
      const url = `https://stardewvalleywiki.com${match[1]}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}: ${url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await sharp(bytes).metadata();
      await writeFile(`public/assets/pixel/${name}.png`, bytes);
      sources.push({
        name,
        page,
        url,
        copyright:
          "Stardew Valley game artwork © ConcernedApe; sourced from Stardew Valley Wiki.",
      });
      console.log(`Downloaded ${name}: ${bytes.length} bytes`);
    } catch (error) {
      console.warn(`Could not download ${name}: ${error.message}`);
    }
  }
  await writeFile(
    "public/assets/pixel/sources.json",
    JSON.stringify(sources, null, 2) + "\n",
  );
}
console.log(
  "Photo, pixel scene and audio assets prepared. Original files preserved.",
);
