import { wedding } from "../data/wedding";
import { useReducedMotion, useScrollProgress } from "../hooks/useScroll";

export function GreetingSequence({
  onMusic,
  musicEnabled,
}: {
  onMusic: () => void;
  musicEnabled: boolean;
}) {
  const { ref, progress } = useScrollProgress();
  const reduced = useReducedMotion();
  const position = progress * (wedding.greeting.length - 1);
  const current = Math.round(position);
  return (
    <section
      ref={ref}
      className="greeting"
      id="hello"
      aria-label={wedding.intro.label}
    >
      <div className="greeting-sticky">
        <p className="greeting-label eyebrow">{wedding.intro.label}</p>
        {wedding.greeting.map((greeting, index) => {
          const distance = index - position;
          const visible = Math.max(0, 1 - Math.abs(distance) * 1.65);
          return (
            <div
              key={index}
              className={`greeting-frame ${index === 0 ? "first-greeting" : ""}`}
              aria-hidden={!reduced && index !== current}
              style={{
                opacity: visible,
                transform: `translateY(${distance * 35}px) scale(${1 - Math.min(Math.abs(distance), 1) * 0.04})`,
                filter: `blur(${Math.min(Math.abs(distance), 1) * 8}px)`,
                visibility: Math.abs(distance) > 1 ? "hidden" : "visible",
                pointerEvents: index === current ? "auto" : "none",
              }}
            >
              <h1>
                {greeting.lines.map((line, lineIndex) => (
                  <span key={lineIndex}>{line}</span>
                ))}
              </h1>
              {greeting.note && (
                <p className="greeting-note">{greeting.note}</p>
              )}
              {index === wedding.greeting.length - 1 && (
                <a
                  className="text-link greeting-music"
                  href="#day1"
                  tabIndex={reduced || index === current ? 0 : -1}
                  onClick={() => {
                    if (!musicEnabled) onMusic();
                  }}
                >
                  {musicEnabled ? wedding.ui.continue : wedding.ui.enableMusic}
                  <span aria-hidden="true">↘</span>
                </a>
              )}
            </div>
          );
        })}
        <div className="greeting-footer">
          <span>
            {wedding.intro.scroll} <span aria-hidden="true">↓</span>
          </span>
          <div className="sequence-dots" aria-hidden="true">
            {wedding.greeting.map((_, i) => (
              <i key={i} className={i === current ? "active" : ""} />
            ))}
          </div>
          <a href="#day1">{wedding.intro.skip} ↗</a>
        </div>
      </div>
    </section>
  );
}
