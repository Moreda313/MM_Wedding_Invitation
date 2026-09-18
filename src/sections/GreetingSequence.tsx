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
        {wedding.greeting.map((greeting, index) => {
          return (
            <div
              key={index}
              className={`greeting-frame ${index === 0 ? "first-greeting" : ""} ${index === current ? "is-current" : index < current ? "is-before" : ""}`}
              aria-hidden={!reduced && index !== current}
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
                    onMusic();
                  }}
                >
                  {musicEnabled ? wedding.ui.continue : wedding.ui.enableMusic}
                  <span aria-hidden="true">↘</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
