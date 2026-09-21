import { useEffect, useRef, useState } from "react";
import type { MusicScene } from "../data/wedding";
import { pinnedProgress, storyViewportHeight } from "./useStoryViewport";

export function useInitialAnchor() {
  useEffect(() => {
    // Safari can resolve the fragment before React has mounted its target.
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function useScrollProgress() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!ref.current) return;
        setProgress(pinnedProgress(ref.current));
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);
  return { ref, progress };
}

export function useMusicScene() {
  const [scene, setScene] = useState<MusicScene>("day1");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let next: MusicScene = "day1";
        document
          .querySelectorAll<HTMLElement>("[data-music]")
          .forEach((element) => {
            if (element.getBoundingClientRect().top <= storyViewportHeight() * 0.5)
              next = element.dataset.music as MusicScene;
          });
        setScene(next);
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, []);
  return scene;
}

// Follow the story, including direct hash entry, scrolling back and reduced motion.
export function useOpeningStage(frameCount: number) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState("opening");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const greeting = document.querySelector<HTMLElement>("#hello");
        const hero = document.querySelector("#day1");
        if (!greeting || !hero) return;
        const height = storyViewportHeight();
        const progress = pinnedProgress(greeting);
        const lastFrame = greeting.querySelector(".greeting-frame:last-of-type");
        const announced = reduced
          ? !!lastFrame &&
            lastFrame.getBoundingClientRect().top <= height * 0.55
          : Math.round(progress * (frameCount - 1)) >= frameCount - 1;
        setStage(
          hero.getBoundingClientRect().top < height * 0.9
            ? "invitation"
            : announced ? "announcement" : "opening",
        );
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, [frameCount, reduced]);
  return stage;
}

// Let the invitation fill the screen while reading down; a small upward scroll
// brings shortcuts back. Keep them available for keyboard and reduced-motion users.
export function useReadingNavigation(available: boolean) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!available) return;
    let frame = 0;
    let previous = Math.max(0, scrollY);
    let travel = 0;
    setVisible(true);
    const reveal = () => { travel = 0; previous = Math.max(0, scrollY); setVisible(true); };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const current = Math.max(0, Math.min(scrollY, document.documentElement.scrollHeight - innerHeight));
        const delta = current - previous;
        previous = current;
        const summary = document.getElementById("info-summary")?.getBoundingClientRect();
        if (reduced || (summary && summary.top < innerHeight * .85 && summary.bottom > 80)
          || document.querySelector(".day-nav a:focus-visible")) {
          travel = 0;
          setVisible(true);
          return;
        }
        if (delta === 0) return;
        travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
        if (travel > 32) setVisible(false);
        if (travel < -16) setVisible(true);
      });
    };
    const keyboard = (event: KeyboardEvent) => { if (event.key === "Tab") reveal(); };
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", reveal);
    addEventListener("hashchange", reveal);
    addEventListener("keydown", keyboard);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", update);
      removeEventListener("resize", reveal);
      removeEventListener("hashchange", reveal);
      removeEventListener("keydown", keyboard);
    };
  }, [available, reduced]);
  return available && (reduced || visible);
}

export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}
