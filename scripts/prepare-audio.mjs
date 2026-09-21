import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";

// New derived assets only; never overwrite the supplied original recordings.
const edits = [
  { id: "day1", source: "rain.mp3", file: "rain-intro-v2.mp3", end: 165.3, fade: 3,
    note: "Conservative end at a quieter window before the user-reported ~168s vocal entry; not a verified vocal-onset timestamp." },
  { id: "transition", source: "21. Fall (Ghost Synth).mp3", file: "fall-loop-v2.mp3", end: 24, fade: 2 },
  { id: "day2", source: "09. Flower Dance.mp3", file: "flower-dance-loop-v2.mp3", end: 29.9, fade: 1.5 },
  { id: "party", source: "08. Pelican Town.mp3", file: "pelican-town-loop-v2.mp3", end: 56.3, fade: 3 },
  { id: "ending", source: "19. Dance Of The Moonlight Jellies.mp3", file: "moonlight-jellies-loop-v2.mp3", end: 55.2, fade: 3 },
];
await mkdir("public/audio", { recursive: true });
for (const edit of edits) {
  const target = `public/audio/${edit.file}`;
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", edit.source,
    "-t", String(edit.end), "-map_metadata", "-1", "-vn", "-af",
    `afade=t=in:st=0:d=0.45,afade=t=out:st=${edit.end - edit.fade}:d=${edit.fade}:curve=hsin`,
    "-c:a", "libmp3lame", "-b:a", "96k", "-ar", "44100", "-ac", "2", target]);
  edit.bytes = (await stat(target)).size;
  console.log(`${edit.id}: ${edit.end}s, ${(edit.bytes / 1024).toFixed(0)} KiB, ${edit.fade}s fade-out → ${target}`);
}
await writeFile("public/audio/edits.json", JSON.stringify({ bitrate: "96kbps stereo", edits }, null, 2) + "\n");
