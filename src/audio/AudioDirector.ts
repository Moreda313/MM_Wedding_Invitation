import { wedding, type MusicScene } from "../data/wedding";
import { assetUrl } from "../lib/assetUrl";

export type AudioStatus = "off" | "loading" | "playing" | "waiting" | "blocked" | "error";
type Voice = { source: AudioBufferSourceNode; gain: GainNode; scene: MusicScene; startedAt: number; offset: number };
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
  private bytes = new Map<string, Promise<ArrayBuffer>>();
  private downloads = new Set<AbortController>();
  private offsets = new Map<MusicScene, number>();
  private voices = new Set<Voice>();
  private dayOneAudio?: HTMLAudioElement;
  private dayOne?: StreamingVoice;
  private generation = 0;
  private enabled = false;
  private playing = false;
  private disposed = false;
  private activeScene?: MusicScene;
  constructor(
    private report: (status: AudioStatus, scene?: MusicScene) => void,
  ) {}

  // Download only: no AudioContext, resume(), play() or status changes in the
  // first two greetings. Playback reuses this exact media element / byte cache.
  async preload(scene: MusicScene) {
    if (this.disposed) return;
    if (scene === "day1") {
      const audio = this.getDayOneAudio();
      if (audio.readyState >= 3) return;
      await new Promise<void>(resolve => {
        const done = () => {
          clearTimeout(timer);
          audio.removeEventListener("canplay", done);
          audio.removeEventListener("error", done);
          resolve();
        };
        const timer = window.setTimeout(done, 2500);
        audio.addEventListener("canplay", done, { once: true });
        audio.addEventListener("error", done, { once: true });
      });
      return;
    }
    const src = wedding.audio.tracks[scene].src;
    await this.loadBytes(src, "low");
    if (this.context && !this.disposed) await this.loadBuffer(src);
  }

  private loadBytes(src: string, priority: RequestPriority = "auto") {
    if (!this.bytes.has(src)) {
      const controller = new AbortController();
      this.downloads.add(controller);
      const pending = fetch(assetUrl(src), { signal: controller.signal, priority })
        .then(response => {
          if (!response.ok) throw new Error("Audio unavailable");
          return response.arrayBuffer();
        })
        .catch(error => { this.bytes.delete(src); throw error; })
        .finally(() => this.downloads.delete(controller));
      this.bytes.set(src, pending);
    }
    return this.bytes.get(src)!;
  }

  private loadBuffer(src: string) {
    if (!this.buffers.has(src)) {
      const context = this.context!;
      this.buffers.set(src, this.loadBytes(src)
        .then(bytes => context.decodeAudioData(bytes.slice(0)))
        .catch(error => {
          this.buffers.delete(src);
          this.bytes.delete(src);
          throw error;
        }));
    }
    return this.buffers.get(src)!;
  }

  private rememberPosition() {
    if (!this.context || !this.playing) return;
    for (const voice of this.voices) {
      if (voice.scene === this.activeScene && voice.source.buffer)
        this.offsets.set(voice.scene, (voice.offset + this.context.currentTime - voice.startedAt) % voice.source.buffer.duration);
    }
  }

  async enable(scene: MusicScene) {
    if (this.disposed) return;
    const request = ++this.generation;
    this.enabled = true;
    try {
      this.context ??= new AudioContext();
      // Try autoplay; if blocked, retry from a real user gesture.
      const resumed = this.context.resume();
      if (this.context.state !== "running") this.report("blocked");
      // Start the streaming media element in the original user gesture on iOS.
      if (scene === "day1" && wedding.audio.tracks.day1.src) {
        await Promise.all([resumed, this.setScene(scene, true)]);
        return;
      }
      await resumed;
      if (this.disposed || !this.enabled || request !== this.generation) return;
      await this.setScene(scene);
    } catch (error) {
      if (!this.disposed && this.enabled && request === this.generation)
        this.report(this.isBlocked(error) ? "blocked" : "error");
    }
  }

  async setScene(scene: MusicScene, fromEnable = false) {
    if (!this.enabled || !this.context || this.disposed) return;
    if (!fromEnable && this.context.state !== "running") {
      this.report("blocked");
      return;
    }
    const request = ++this.generation;
    const context = this.context;
    const track = wedding.audio.tracks[scene];
    if (!track.src) {
      this.fadeOut(0.4);
      this.report("waiting");
      return;
    }
    this.report(context.state === "running" ? "loading" : "blocked");
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
        this.rememberPosition();
        this.fadeOut(wedding.audio.fadeSeconds, true);
        this.ramp(stream.gain, track.volume, wedding.audio.fadeSeconds);
        this.activeScene = scene;
        this.playing = true;
        this.report("playing", scene);
        return;
      }
      const buffer = await this.loadBuffer(track.src);
      if (request !== this.generation || !this.enabled || this.disposed) return;
      if (context.state !== "running") await context.resume();
      if (request !== this.generation || !this.enabled || this.disposed) return;
      this.rememberPosition();
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
      const offset = this.offsets.get(scene) || 0;
      const voice = { source, gain, scene, offset, startedAt: context.currentTime };
      this.voices.add(voice);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        this.voices.delete(voice);
      };
      source.start(0, offset);
      this.activeScene = scene;
      this.playing = true;
      this.report("playing", scene);
    } catch (error) {
      if (request === this.generation && !this.disposed) {
        this.fadeOut(0.4);
        this.report(this.isBlocked(error) ? "blocked" : "error");
      }
    }
  }

  private isBlocked(error: unknown) {
    return error instanceof DOMException && error.name === "NotAllowedError";
  }

  private getDayOneAudio() {
    if (this.dayOneAudio) return this.dayOneAudio;
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    audio.setAttribute("playsinline", "");
    audio.src = assetUrl(wedding.audio.tracks.day1.src);
    this.dayOneAudio = audio;
    audio.addEventListener("error", () => {
      if (!this.disposed && this.enabled && this.dayOne?.wanted)
        this.report("error");
    });
    audio.load();
    return audio;
  }

  private getDayOne(): StreamingVoice {
    if (this.dayOne) return this.dayOne;
    const audio = this.getDayOneAudio();
    const context = this.context!;
    const source = context.createMediaElementSource(audio);
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(context.destination);
    this.dayOne = { audio, source, gain, wanted: false };
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
    if (this.enabled) this.rememberPosition();
    this.playing = false;
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
        if (this.enabled && !this.disposed) this.report("waiting");
      } else {
        const resumed = this.context.resume();
        if (this.context.state !== "running") this.report("blocked");
        await resumed;
        if (!this.enabled || this.disposed) return;
        if (this.enabled && !this.disposed && this.dayOne?.wanted)
          await this.dayOne.audio.play();
        if (this.enabled && !this.disposed && this.activeScene)
          this.report("playing", this.activeScene);
      }
    } catch (error) {
      if (!this.disposed && this.enabled)
        this.report(this.isBlocked(error) ? "blocked" : "error");
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
    this.downloads.forEach(controller => controller.abort());
    this.downloads.clear();
    this.bytes.clear();
    this.buffers.clear();
    if (this.dayOne) {
      clearTimeout(this.dayOne.pauseTimer);
      this.dayOne.source.disconnect();
      this.dayOne.gain.disconnect();
    }
    if (this.dayOneAudio) {
      this.dayOneAudio.pause();
      this.dayOneAudio.removeAttribute("src");
      this.dayOneAudio.load();
    }
    void this.context?.close();
  }
}
