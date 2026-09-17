import { wedding } from "../data/wedding";
import { PixelIcon } from "../components/PixelIcon";
import { assetUrl } from "../lib/assetUrl";

export function Ending() {
  return (
    <footer className="ending section-pad" data-music="ending" id="ending">
      <div className="sunset-sun" aria-hidden="true" />
      <div className="sunset-hill back" aria-hidden="true" />
      <div className="sunset-hill front" aria-hidden="true" />
      <div className="ending-content">
        <p className="eyebrow">{wedding.ending.eyebrow}</p>
        <div className="ending-picture">
          <img
            src={assetUrl(wedding.pixel.couple || wedding.pixel.hero)}
            alt="像素新人在花架下等你来"
            loading="lazy"
            width="621"
            height="482"
          />
        </div>
        <p className="ending-english">{wedding.ending.english}</p>
        <h2>{wedding.ending.note}</h2>
        <p className="ending-names">
          {wedding.couple.groom}
          <span>&</span>
          {wedding.couple.bride}
        </p>
        <p className="ending-dates">{wedding.intro.dates}</p>
        <div className="ending-sprout">
          <PixelIcon name="Acorn" />
        </div>
        <a className="text-link" href="#hello">
          {wedding.ending.top}
          <span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
