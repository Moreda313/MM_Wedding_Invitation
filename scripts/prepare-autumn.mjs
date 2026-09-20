import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

// Extract the autumn column from the Wiki's four-season sprite sheets.
// Keep native pixels and transparency; no enlargement or recoloring.
const assets = [
  { name: "Maple_Fall", page: "Maple_Tree", path: "3/3b/Maple_Stage_5.png", crop: { left: 200, top: 0, width: 96, height: 190 } },
  { name: "Oak_Fall", page: "Oak_Tree", path: "d/d3/Oak_Stage_5.png", crop: { left: 204, top: 0, width: 98, height: 188 } },
  { name: "Stardrop", path: "a/a5/Stardrop.png" },
  { name: "Pumpkin", path: "6/64/Pumpkin.png" },
  { name: "Cranberries", path: "6/6e/Cranberries.png" },
  { name: "Hazelnut", path: "3/31/Hazelnut.png" },
];
const folder = "public/assets/pixel";
const sources = JSON.parse(await readFile(`${folder}/sources.json`, "utf8"));
for (const asset of assets) {
  const url = `https://stardewvalleywiki.com/mediawiki/images/${asset.path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  let bytes = Buffer.from(await response.arrayBuffer());
  await sharp(bytes).metadata();
  if (asset.crop) bytes = await sharp(bytes).extract(asset.crop).png().toBuffer();
  await writeFile(`${folder}/${asset.name}.png`, bytes);
  const source = {
    name: asset.name,
    page: `https://stardewvalleywiki.com/${asset.page || asset.name}`,
    url,
    ...(asset.crop ? { crop: asset.crop } : {}),
    copyright: "Stardew Valley game artwork © ConcernedApe; sourced from Stardew Valley Wiki.",
  };
  const index = sources.findIndex(item => item.name === asset.name);
  if (index < 0) sources.push(source);
  else sources[index] = source;
  console.log(`${asset.name}: ${bytes.length} bytes`);
}
await writeFile(`${folder}/sources.json`, JSON.stringify(sources, null, 2) + "\n");
