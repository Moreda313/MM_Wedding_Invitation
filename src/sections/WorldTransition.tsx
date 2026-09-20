import { useEffect, useState } from "react";
import { wedding } from "../data/wedding";
import { useReducedMotion, useScrollProgress } from "../hooks/useScroll";
import { assetUrl } from "../lib/assetUrl";

export function WorldTransition() {
  const { ref, progress } = useScrollProgress();
  const reduced = useReducedMotion();
  const revealed = progress >= 0.22;
  const worldProgress = reduced ? 1 : Math.max(0, (progress - 0.22) / 0.78);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px" },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  const pixel = worldProgress < 0.27 ? 96 : worldProgress < 0.48 ? 48 : 24;
  return (
    <section
      className={`world-transition ${revealed ? "is-revealed" : ""}`}
      ref={ref}
      data-music="transition"
      aria-label={wedding.transition.surprise}
    >
      <div
        className="transition-sticky"
        style={
          { "--transition-progress": worldProgress } as React.CSSProperties
        }
      >
        <div className="transition-wash" style={{ opacity: worldProgress }} />
        <div className="transition-stage">
          <div className="transition-teaser" aria-hidden={!reduced && revealed}>
            <h2>{wedding.transition.surprise}</h2>
          </div>
          <div className="transition-world" aria-hidden={!reduced && !revealed}>
            <div className="transition-copy">
              <h2>
                {wedding.transition.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
            </div>
            <div className="portal">
              <img
                src={assetUrl("/assets/photos/couple-640.webp")}
                alt=""
                className="portal-real"
                loading="lazy"
                style={{ opacity: 1 - Math.min(worldProgress * 3, 1) }}
              />
              {near && (
                <>
                  <img
                    src={assetUrl(`/assets/photos/pixel-${pixel}.webp`)}
                    alt=""
                    className="portal-pixels"
                    style={{
                      opacity:
                        Math.min(worldProgress * 4, 1) *
                        (1 - Math.max(0, (worldProgress - 0.6) * 3)),
                    }}
                  />
                  <img
                    src={assetUrl(wedding.pixel.hero)}
                    alt=""
                    className="portal-new"
                    style={{ opacity: Math.max(0, (worldProgress - 0.5) * 2) }}
                  />
                </>
              )}
              <div
                className="portal-grid"
                style={{ opacity: Math.sin(worldProgress * Math.PI) * 0.2 }}
              />
            </div>
            <p className="transition-caption">{wedding.transition.after}</p>
          </div>
        </div>
        <div className="transition-actions">
          <a className="pixel-enter" href="#day2">
            <span>{wedding.transition.enter}</span>
            <span className="pixel-arrow" aria-hidden="true" />
          </a>
          <p>
            {wedding.transition.hint} <span aria-hidden="true">↓</span>
          </p>
        </div>
      </div>
    </section>
  );
}
