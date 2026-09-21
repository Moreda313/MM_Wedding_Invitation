import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

// Animate the artwork, never the button's hit area. Repeated taps restart one
// bounded effect rather than queuing shakes or leaving a selected state behind.
export function TownInteraction({
  tree = false,
  children,
  ...props
}: ComponentPropsWithoutRef<"button"> & { tree?: boolean }) {
  const button = useRef<HTMLButtonElement>(null);
  const animations = useRef<Animation[]>([]);
  const cancel = () => {
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
  };

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", cancel);
    return () => {
      preference.removeEventListener("change", cancel);
      cancel();
    };
  }, []);

  function play() {
    cancel();
    const element = button.current!;
    const artwork = element.querySelector(tree ? ".pixel-icon" : ".map-icon")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (target: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = target.animate(frames, options);
      animation.onfinish = () => animation.cancel();
      animations.current.push(animation);
    };

    if (reduced) {
      animate(artwork, [{ opacity: 1 }, { opacity: .65 }, { opacity: 1 }], { duration: 240 });
      return;
    }

    animate(artwork, tree ? [
      { transform: "rotate(0deg)" },
      { transform: "rotate(-5deg)", offset: .16 },
      { transform: "rotate(4deg)", offset: .34 },
      { transform: "rotate(-3deg)", offset: .53 },
      { transform: "rotate(1.5deg)", offset: .74 },
      { transform: "rotate(0deg)" },
    ] : [
      { transform: "translateY(0) rotate(0deg)" },
      { transform: "translateY(2px) scale(1.04, .94)", offset: .12 },
      { transform: "translateY(-7px) rotate(-7deg)", offset: .32 },
      { transform: "translateY(-3px) rotate(5deg)", offset: .54 },
      { transform: "translateY(0) rotate(-3deg)", offset: .76 },
      { transform: "translateY(0) rotate(0deg)" },
    ], { duration: tree ? 560 : 460, easing: "steps(2, end)" });

    if (tree) {
      element.querySelectorAll(".falling-leaf").forEach((leaf, index) => {
        const drift = [-18, 22, -10, 30][index];
        animate(leaf, [
          { opacity: 0, transform: "translate(0, 0) rotate(0deg)" },
          { opacity: 1, transform: `translate(${drift * .2}px, 5px) rotate(25deg)`, offset: .12 },
          { opacity: 1, transform: `translate(${drift}px, 30px) rotate(110deg)`, offset: .55 },
          { opacity: 0, transform: `translate(${drift * .6}px, 66px) rotate(200deg)` },
        ], { duration: 1050, delay: 80 + index * 90, easing: "steps(12, end)" });
      });
    }
  }

  return (
    <button {...props} ref={button} type="button" onClick={play}>
      {children}
      {tree && <span className="tree-leaves" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <i className="map-leaf falling-leaf" key={index} />)}
      </span>}
    </button>
  );
}
