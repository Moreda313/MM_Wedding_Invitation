import { useEffect, useRef, useState } from "react";
import type { MusicScene } from "../data/wedding";

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
        const rect = ref.current.getBoundingClientRect();
        setProgress(
          Math.max(
            0,
            Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)),
          ),
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
            if (element.getBoundingClientRect().top <= innerHeight * 0.5)
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
        const greeting = document.querySelector("#hello");
        const hero = document.querySelector("#day1");
        if (!greeting || !hero) return;
        const rect = greeting.getBoundingClientRect();
        const progress = Math.max(
          0, -rect.top / Math.max(1, rect.height - innerHeight),
        );
        const lastFrame = greeting.querySelector(".greeting-frame:last-of-type");
        const announced = reduced
          ? !!lastFrame &&
            lastFrame.getBoundingClientRect().top <= innerHeight * 0.55
          : Math.round(progress * (frameCount - 1)) >= frameCount - 1;
        setStage(
          hero.getBoundingClientRect().top < innerHeight * 0.9
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
