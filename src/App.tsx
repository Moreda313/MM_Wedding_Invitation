import { wedding } from "./data/wedding";
import { useMusicScene, useReveal } from "./hooks/useScroll";
import { MusicControl, useMusic } from "./components/MusicControl";
import { GreetingSequence } from "./sections/GreetingSequence";
import { DayOne } from "./sections/DayOne";
import { WorldTransition } from "./sections/WorldTransition";
import { DayTwo } from "./sections/DayTwo";
import { Ending } from "./sections/Ending";

export default function App() {
  const scene = useMusicScene();
  const { status, track, toggle } = useMusic(scene);
  useReveal();
  const autumn = scene !== "day1";
  return (
    <div
      className={`invitation ${autumn ? "autumn-active" : ""}`}
      data-scene={scene}
      data-audio-status={status}
      data-audio-track={track || ""}
    >
      <header className="site-header">
        <a className="brand" href="#hello" aria-label="回到开头">
          {wedding.couple.monogram}
        </a>
        <MusicControl status={status} toggle={toggle} />
      </header>
      <main>
        <GreetingSequence
          onMusic={toggle}
          musicEnabled={status !== "off" && status !== "error"}
        />
        <DayOne />
        <WorldTransition />
        <DayTwo />
        <Ending />
      </main>
      <nav className="day-nav" aria-label={wedding.ui.itinerary}>
        <a href="#day1-info">{wedding.ui.jumpDay1}</a>
        <span />
        <a href="#day2-info">{wedding.ui.jumpDay2}</a>
      </nav>
    </div>
  );
}
