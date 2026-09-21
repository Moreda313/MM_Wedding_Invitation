import { useLayoutEffect } from "react";

// Browser chrome can resize a mobile WebView while the reader scrolls back.
// Keep the story's layout fixed for that orientation; desktop window resizing
// and phone rotation still get a fresh measurement.
export function useStoryViewport() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--story-vh");
    const touchViewport = matchMedia("(hover: none) and (pointer: coarse)");
    let width = -1;
    let frame = 0;
    const measure = () => {
      const nextWidth = root.clientWidth;
      if (touchViewport.matches && nextWidth === width) return;
      width = nextWidth;
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;width:0;height:100vh;height:100svh;top:0;left:0;";
      root.append(probe);
      const height = probe.getBoundingClientRect().height;
      probe.remove();
      root.style.setProperty("--story-vh", `${height / 100}px`);
    };
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    addEventListener("resize", resize);
    touchViewport.addEventListener("change", resize);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      touchViewport.removeEventListener("change", resize);
      if (previous) root.style.setProperty("--story-vh", previous);
      else root.style.removeProperty("--story-vh");
    };
  }, []);
}

export function storyViewportHeight() {
  return parseFloat(document.documentElement.style.getPropertyValue("--story-vh")) * 100 || innerHeight;
}

export function pinnedProgress(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  // Both scroll-driven sections have one direct sticky stage. Its actual
  // height, not the changing visible browser viewport, defines its travel.
  const stageHeight = element.firstElementChild?.getBoundingClientRect().height
    ?? storyViewportHeight();
  return Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - stageHeight)));
}
