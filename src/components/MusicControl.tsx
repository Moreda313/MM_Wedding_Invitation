import { useEffect, useRef, useState } from "react";
import { AudioDirector, type AudioStatus } from "../audio/AudioDirector";
import { wedding, type MusicScene } from "../data/wedding";

export function useMusic(scene: MusicScene) {
  const [status, setStatus] = useState<AudioStatus>("off");
  const [track, setTrack] = useState<MusicScene | undefined>();
  const director = useRef<AudioDirector | null>(null);
  const enabled = useRef(false);
  useEffect(() => {
    const instance = new AudioDirector((nextStatus, nextTrack) => {
      setStatus(nextStatus);
      setTrack(nextTrack);
    });
    director.current = instance;
    const visibility = () => {
      void instance.visibility(document.hidden);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      instance.dispose();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (enabled.current) void director.current?.setScene(scene);
    }, 180);
    return () => clearTimeout(timer);
  }, [scene]);
  const toggle = () => {
    if (enabled.current && status !== "error") {
      director.current?.disable();
      enabled.current = false;
    } else {
      enabled.current = true;
      void director.current?.enable(scene);
    }
  };
  return { status, track, toggle };
}

export function MusicControl({
  status,
  toggle,
}: {
  status: AudioStatus;
  toggle: () => void;
}) {
  const on = ["loading", "playing", "waiting"].includes(status);
  const label =
    status === "error"
      ? wedding.ui.musicError
      : status === "waiting"
        ? wedding.ui.musicWaiting
        : status === "loading"
          ? wedding.ui.musicLoading
          : on
            ? wedding.ui.musicOn
            : wedding.ui.musicOff;
  return (
    <button
      className={`music-control ${status === "playing" ? "playing" : ""}`}
      onClick={toggle}
      aria-label={label}
      aria-pressed={on}
      title={label}
    >
      <span className="music-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>{on ? wedding.ui.musicOn : wedding.ui.musicOff}</span>
      <span className="sr-only" role="status">
        {label}
      </span>
    </button>
  );
}
