import { wedding, type MusicScene } from "../data/wedding";
import { assetUrl } from "../lib/assetUrl";

export type AudioStatus = "off" | "loading" | "playing" | "waiting" | "error";
type Voice = { source: AudioBufferSourceNode; gain: GainNode };

// Web Audio gain ramps also work on iOS, where HTMLAudioElement.volume is limited.
export class AudioDirector {
  private context?: AudioContext;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private voices = new Set<Voice>();
  private generation = 0;
  private enabled = false;
  private disposed = false;
  constructor(
    private report: (status: AudioStatus, scene?: MusicScene) => void,
  ) {}

  async enable(scene: MusicScene) {
    const request = ++this.generation;
    this.enabled = true;
    try {
      this.context ??= new AudioContext();
      // This call runs directly in the button's gesture, before any fetch.
      await this.context.resume();
      if (this.disposed || !this.enabled || request !== this.generation) return;
      await this.setScene(scene);
    } catch {
      if (!this.disposed && this.enabled && request === this.generation)
        this.report("error");
    }
  }

  async setScene(scene: MusicScene) {
    if (!this.enabled || !this.context || this.disposed) return;
    const request = ++this.generation;
    const context = this.context;
    const track = wedding.audio.tracks[scene];
    if (!track.src) {
      this.fadeOut(0.4);
      this.report("waiting");
      return;
    }
    this.report("loading");
    try {
      if (!this.buffers.has(track.src)) {
        this.buffers.set(
          track.src,
          fetch(assetUrl(track.src))
            .then((response) => {
              if (!response.ok) throw new Error("Audio unavailable");
              return response.arrayBuffer();
            })
            .then((bytes) => context.decodeAudioData(bytes))
            .catch((error) => {
              this.buffers.delete(track.src);
              throw error;
            }),
        );
      }
      const buffer = await this.buffers.get(track.src)!;
      if (request !== this.generation || !this.enabled || this.disposed) return;
      if (context.state !== "running") await context.resume();
      if (request !== this.generation || !this.enabled || this.disposed) return;
      this.fadeOut(wedding.audio.fadeSeconds);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(
        track.volume,
        context.currentTime + wedding.audio.fadeSeconds,
      );
      source.connect(gain).connect(context.destination);
      const voice = { source, gain };
      this.voices.add(voice);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        this.voices.delete(voice);
      };
      source.start();
      this.report("playing", scene);
    } catch {
      if (request === this.generation && !this.disposed) {
        this.fadeOut(0.4);
        this.report("error");
      }
    }
  }

  private fadeOut(seconds: number) {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const voice of this.voices) {
      if (typeof voice.gain.gain.cancelAndHoldAtTime === "function")
        voice.gain.gain.cancelAndHoldAtTime(now);
      else {
        const value = voice.gain.gain.value;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(value, now);
      }
      voice.gain.gain.linearRampToValueAtTime(0, now + seconds);
      try {
        voice.source.stop(now + seconds + 0.05);
      } catch {
        /* already stopped */
      }
    }
  }

  disable() {
    this.enabled = false;
    ++this.generation;
    this.fadeOut(0.25);
    this.report("off");
  }
  async visibility(hidden: boolean) {
    if (!this.context || !this.enabled) return;
    try {
      if (hidden) await this.context.suspend();
      else await this.context.resume();
    } catch {
      if (!this.disposed) this.report("error");
    }
  }
  dispose() {
    this.disposed = true;
    this.enabled = false;
    ++this.generation;
    for (const voice of this.voices) {
      try {
        voice.source.stop();
      } catch {
        /* stopped */
      }
    }
    this.voices.clear();
    void this.context?.close();
  }
}
