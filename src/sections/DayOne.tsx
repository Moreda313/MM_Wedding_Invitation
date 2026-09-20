import { wedding } from "../data/wedding";
import { DayInfo } from "../components/DayInfo";
import { assetUrl } from "../lib/assetUrl";

export function DayOne() {
  return (
    <div className="day-one" data-music="day1">
      <section className="day-one-hero" id="day1">
        <img
          className="couple-photo"
          src={assetUrl("/assets/photos/couple-960.webp")}
          srcSet={[640, 960, 1440]
            .map(
              (width) =>
                `${assetUrl(`/assets/photos/couple-${width}.webp`)} ${width}w`,
            )
            .join(", ")}
          sizes="(min-width: 800px) 760px, 100vw"
          alt={wedding.hero.photoAlt}
          width="960"
          height="1440"
          loading="lazy"
        />
        <div className="hero-top">
          <p className="eyebrow">
            {wedding.day1.label} <span> / </span> {wedding.day1.date}
          </p>
        </div>
        <div className="hero-names">
          <p className="monogram">{wedding.couple.monogram}</p>
          <h2>
            {wedding.couple.groom}
            <span>&</span>
            {wedding.couple.bride}
          </h2>
          <p>{wedding.hero.together}</p>
        </div>
      </section>
      <DayInfo day={wedding.day1} />
    </div>
  );
}
