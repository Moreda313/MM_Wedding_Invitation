import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const { edits } = JSON.parse(await readFile("public/audio/edits.json", "utf8"));
let total = 0;
for (const edit of edits) {
  const file = `public/audio/${edit.file}`;
  const bytes = (await stat(file)).size;
  total += bytes;
  assert.equal(bytes, edit.bytes);
  const pcm = execFileSync(ffmpeg, ["-v", "error", "-i", file, "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"], { maxBuffer: 16 * 1024 * 1024 });
  const samples = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);
  const duration = samples.length / 16000;
  assert.ok(Math.abs(duration - edit.end) < .05);
  assert.ok(duration < (edit.id === "day1" ? 168 : 60));
  const rms = (start, end) => {
    let energy = 0;
    for (let i = start; i < end; i++) energy += samples[i] ** 2;
    return Math.sqrt(energy / (end - start));
  };
  const body = rms(16000, samples.length - 16000);
  assert.ok(body > .005, "The shortened file must contain audible music");
  assert.ok(rms(0, 640) < body * .2, "Gentle loop entry");
  assert.ok(rms(samples.length - 640, samples.length) < body * .01, "Tail reaches silence without a hard cut");
  console.log(`${edit.id}: ${duration.toFixed(3)}s, ${(bytes / 1024).toFixed(0)} KiB; soft start/end verified`);
}
assert.ok(total < 4 * 1024 * 1024);
console.log(`Total active music: ${(total / 1024 / 1024).toFixed(2)} MiB`);
