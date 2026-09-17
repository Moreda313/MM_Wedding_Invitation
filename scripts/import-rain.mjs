import { createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const bvid = "BV1at411L7Px";
const headers = {
  "User-Agent": "Mozilla/5.0",
  Referer: `https://www.bilibili.com/video/${bvid}/`,
};
try {
  await access("rain.mp3");
  throw new Error("rain.mp3 already exists; preserving the existing file.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
async function api(url) {
  const response = await fetch(url, { headers });
  if (!response.ok)
    throw new Error(`Bilibili returned HTTP ${response.status}`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(`Bilibili: ${data.message}`);
  return data.data;
}
const video = await api(
  `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
);
const playback = await api(
  `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${video.cid}&fnval=16&qn=80&fourk=1`,
);
const tracks = playback.dash?.audio || [];
const track = [...tracks].sort((a, b) => b.bandwidth - a.bandwidth)[0];
if (!track) throw new Error("No publicly available audio track found.");
console.log(
  `Extracting: ${video.title}; ${(playback.timelength / 1000).toFixed(1)} seconds; ${(track.bandwidth / 1000).toFixed(0)} kbps source audio.`,
);
const temp = await mkdtemp(join(tmpdir(), "mm-rain-"));
const source = join(temp, "source.m4a");
const response = await fetch(track.baseUrl || track.base_url, { headers });
if (!response.ok || !response.body)
  throw new Error(`Audio download failed: HTTP ${response.status}`);
await pipeline(Readable.fromWeb(response.body), createWriteStream(source));
console.log("Source downloaded. Converting the complete track to MP3.");
execFileSync(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-n",
  "-i",
  source,
  "-map_metadata",
  "-1",
  "-vn",
  "-c:a",
  "libmp3lame",
  "-q:a",
  "2",
  "rain.mp3",
]);
await mkdir("public/audio", { recursive: true });
execFileSync(ffmpeg, [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  source,
  "-map_metadata",
  "-1",
  "-vn",
  "-c:a",
  "libmp3lame",
  "-b:a",
  "128k",
  "-ar",
  "44100",
  "public/audio/rain.mp3",
]);
console.log(
  "Saved rain.mp3 and public/audio/rain.mp3. Both retain the full duration.",
);
