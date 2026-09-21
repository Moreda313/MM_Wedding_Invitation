import { wedding } from "./data/wedding";
import {
  useInitialAnchor,
  useReadingNavigation,
  useMusicScene,
  useOpeningStage,
  useReveal,
} from "./hooks/useScroll";
import { MusicControl, useMusic } from "./components/MusicControl";
import { GreetingSequence } from "./sections/GreetingSequence";
import { DayOne } from "./sections/DayOne";
import { WorldTransition } from "./sections/WorldTransition";
import { DayTwo } from "./sections/DayTwo";
import { Ending } from "./sections/Ending";
import { MemoryWall } from "./sections/MemoryWall";
import { InvitationSummary } from "./sections/InvitationSummary";
import { useUpcomingAssets } from "./hooks/useUpcomingAssets";

export default function App() {
  useInitialAnchor();
  const scene = useMusicScene();
  const openingStage = useOpeningStage(wedding.greeting.length);
  const showMusic = openingStage !== "opening";
  const showNavigation = openingStage === "invitation";
  const showDayNavigation = useReadingNavigation(showNavigation);
  const { status, track, enabled, toggle, enableMusic } = useMusic(scene, showMusic);
  useReveal();
  useUpcomingAssets();
  const autumn = scene !== "day1";
  return (
    <div
      className={`invitation ${autumn ? "autumn-active" : ""}`}
      data-scene={scene}
      data-audio-status={status}
      data-audio-track={track || ""}
      data-music-enabled={enabled}
      data-opening-stage={openingStage}
    >
      <header className="site-header">
        <a
          className="brand chrome-piece"
          href="#hello"
          aria-label="回到开头"
          data-visible={showNavigation}
          aria-hidden={!showNavigation}
          inert={!showNavigation}
        >
          {wedding.couple.monogram}
        </a>
        <div
          className="music-shell chrome-piece"
          data-visible={showMusic}
          aria-hidden={!showMusic}
          inert={!showMusic}
        >
          <MusicControl status={status} toggle={toggle} />
        </div>
      </header>
      <main>
        <GreetingSequence
          onMusic={enableMusic}
          musicEnabled={enabled}
        />
        <DayOne />
        <WorldTransition />
        <DayTwo />
        <MemoryWall />
        <Ending />
        <InvitationSummary />
      </main>
      <nav
        className="day-nav chrome-piece"
        aria-label={wedding.ui.itinerary}
        data-visible={showDayNavigation}
        aria-hidden={!showDayNavigation}
        inert={!showDayNavigation}
      >
        <a href="#day1-info">{wedding.ui.jumpDay1}</a>
        <span />
        <a href="#day2-info">{wedding.ui.jumpDay2}</a>
        <span />
        <a href="#info-summary">{wedding.ui.jumpSummary}</a>
      </nav>
    </div>
  );
}
