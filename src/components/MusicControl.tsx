import { useEffect, useRef, useState } from "react";
import { AudioDirector, type AudioStatus } from "../audio/AudioDirector";
import { wedding, type MusicScene } from "../data/wedding";

function initialPreference() {
  try { return sessionStorage.getItem("mm-music-muted") !== "1"; }
  catch { return true; }
}

export function useMusic(scene: MusicScene) {
  const [enabled, setEnabled] = useState(initialPreference);
  const [status, setStatus] = useState<AudioStatus>(enabled ? "blocked" : "off");
  const [track, setTrack] = useState<MusicScene | undefined>();
  const director = useRef<AudioDirector | null>(null);
  const enabledRef = useRef(enabled);
  const statusRef = useRef(status);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  useEffect(() => {
    const instance = new AudioDirector((nextStatus, nextTrack) => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
      setTrack(nextTrack);
    });
    director.current = instance;
    const visibility = () => {
      void instance.visibility(document.hidden);
    };
    const unlock = (event: Event) => {
      if (!event.isTrusted || !enabledRef.current || statusRef.current !== "blocked") return;
      // Explicit controls own their gesture. Muting disables all automatic retries.
      if (event.target instanceof Element && event.target.closest(".music-control, .greeting-music")) return;
      void instance.enable(sceneRef.current);
    };
    const gestures = ["pointerdown", "touchend", "click", "keydown"];
    gestures.forEach((event) => document.addEventListener(event, unlock, { passive: true }));
    document.addEventListener("visibilitychange", visibility);
    const autoplay = window.setTimeout(() => {
      if (enabledRef.current) void instance.enable(sceneRef.current);
    }, 0);
    return () => {
      clearTimeout(autoplay);
      instance.dispose();
      gestures.forEach((event) => document.removeEventListener(event, unlock));
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (enabledRef.current && statusRef.current !== "blocked")
        void director.current?.setScene(scene);
    }, 180);
    return () => clearTimeout(timer);
  }, [scene]);
  const preference = (value: boolean) => {
    enabledRef.current = value;
    setEnabled(value);
    try { sessionStorage.setItem("mm-music-muted", value ? "0" : "1"); }
    catch { /* Playback still works when storage is unavailable. */ }
  };
  const enableMusic = () => {
    preference(true);
    if (statusRef.current !== "playing") void director.current?.enable(sceneRef.current);
  };
  const toggle = () => {
    if (enabledRef.current && statusRef.current !== "error") {
      preference(false);
      director.current?.disable();
    } else {
      enableMusic();
    }
  };
  return { status, track, enabled, toggle, enableMusic };
}

export function MusicControl({
  status,
  toggle,
}: {
  status: AudioStatus;
  toggle: () => void;
}) {
  const on = ["loading", "playing", "waiting", "blocked"].includes(status);
  const label =
    status === "error"
      ? wedding.ui.musicError
      : status === "blocked"
        ? wedding.ui.musicBlocked
      : status === "waiting"
        ? wedding.ui.musicWaiting
        : status === "loading"
          ? wedding.ui.musicLoading
          : on
            ? wedding.ui.musicOn
            : wedding.ui.musicOff;
  const accessible = status === "blocked" ? wedding.ui.musicBlockedHint
    : on ? `${label}，点击关闭音乐` : label;
  return (
    <button
      className={`music-control ${status === "playing" ? "playing" : ""}`}
      onClick={toggle}
      aria-label={accessible}
      aria-pressed={on}
      title={accessible}
    >
      <span className="music-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        {label}
      </span>
      <span className="sr-only" role="status">
        {accessible}
      </span>
    </button>
  );
}
