import { useEffect } from "react";
import { afterPageReady } from "../lib/afterPageReady";
import { assetUrl } from "../lib/assetUrl";

export function useUpcomingAssets() {
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const stop = afterPageReady(() => {
      // Start just after Rain's initial buffering, without waiting for Day 2.
      timer = window.setTimeout(() => {
        if (cancelled) return;
        document.querySelectorAll<HTMLImageElement>(".day-two img, .world-transition img, #memory-wall img, #ending img")
          .forEach(image => {
            image.fetchPriority = "low";
            image.loading = "eager";
          });
        // These progressively pixelated frames mount only during the transition.
        for (const size of [96, 48, 24]) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.fetchPriority = "low";
          link.href = assetUrl(`/assets/photos/pixel-${size}.webp`);
          link.dataset.upcomingAsset = "true";
          document.head.append(link);
        }
      }, 600);
    });
    return () => {
      cancelled = true;
      stop();
      clearTimeout(timer);
      document.querySelectorAll('link[data-upcoming-asset]').forEach(link => link.remove());
    };
  }, []);
}
