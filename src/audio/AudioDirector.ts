import { wedding, type MusicScene } from "../data/wedding";
import { assetUrl } from "../lib/assetUrl";

export type AudioStatus = "off" | "loading" | "playing" | "waiting" | "error";
type Voice = { source: AudioBufferSourceNode; gain: GainNode };
type StreamingVoice = {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
  wanted: boolean;
  pauseTimer?: number;
};

// Web Audio gain ramps also work on iOS, where HTMLAudioElement.volume is limited.
export class AudioDirector {
  private context?: AudioContext;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private voices = new Set<Voice>();
  private dayOne?: StreamingVoice;
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
      const resumed = this.context.resume();
      // Start the streaming media element in the original user gesture on iOS.
      if (scene === "day1" && wedding.audio.tracks.day1.src) {
        await Promise.all([resumed, this.setScene(scene)]);
        return;
      }
      await resumed;
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
      if (scene === "day1") {
        const stream = this.getDayOne();
        clearTimeout(stream.pauseTimer);
        stream.wanted = true;
        if (stream.audio.error) stream.audio.load();
        await stream.audio.play();
        if (request !== this.generation || !this.enabled || this.disposed)
          return;
        if (context.state !== "running") await context.resume();
        if (request !== this.generation || !this.enabled || this.disposed)
          return;
        this.fadeOut(wedding.audio.fadeSeconds, true);
        this.ramp(stream.gain, track.volume, wedding.audio.fadeSeconds);
        this.report("playing", scene);
        return;
      }
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

  private getDayOne(): StreamingVoice {
    if (this.dayOne) return this.dayOne;
    const audio = new Audio();
    audio.preload = "none";
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audio.setAttribute("playsinline", "");
    audio.src = assetUrl(wedding.audio.tracks.day1.src);
    const context = this.context!;
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(context.destination);
    this.dayOne = { audio, source, gain, wanted: false };
    audio.addEventListener("error", () => {
      if (!this.disposed && this.enabled && this.dayOne?.wanted)
        this.report("error");
    });
    return this.dayOne;
  }

  private ramp(gain: GainNode, volume: number, seconds: number) {
    const now = this.context!.currentTime;
    if (typeof gain.gain.cancelAndHoldAtTime === "function")
      gain.gain.cancelAndHoldAtTime(now);
    else {
      const value = gain.gain.value;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(value, now);
    }
    gain.gain.linearRampToValueAtTime(volume, now + seconds);
  }

  private fadeOut(seconds: number, keepDayOne = false) {
    if (!this.context) return;
    const now = this.context.currentTime;
    if (this.dayOne && !keepDayOne) {
      const stream = this.dayOne;
      stream.wanted = false;
      clearTimeout(stream.pauseTimer);
      this.ramp(stream.gain, 0, seconds);
      stream.pauseTimer = window.setTimeout(
        () => stream.audio.pause(),
        seconds * 1000 + 50,
      );
    }
    for (const voice of this.voices) {
      this.ramp(voice.gain, 0, seconds);
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
      if (hidden) {
        this.dayOne?.audio.pause();
        await this.context.suspend();
      } else {
        await this.context.resume();
        if (this.enabled && !this.disposed && this.dayOne?.wanted)
          await this.dayOne.audio.play();
      }
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
    if (this.dayOne) {
      clearTimeout(this.dayOne.pauseTimer);
      this.dayOne.audio.pause();
      this.dayOne.audio.removeAttribute("src");
      this.dayOne.audio.load();
      this.dayOne.source.disconnect();
      this.dayOne.gain.disconnect();
    }
    void this.context?.close();
  }
}
