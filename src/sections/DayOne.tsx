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
      <PhotoStory />
    </div>
  );
}

function PhotoStory() {
  return (
    <section
      className="photo-story section-pad"
      aria-label={wedding.story.title}
    >
      <div data-reveal>
        <h2 className="preserve">{wedding.story.title}</h2>
      </div>
      <div className="story-grid">
        {wedding.story.photos.map((photo, index) => (
          <figure
            className={`story-photo story-photo-${index + 1} ${photo.src ? "filled" : "empty"}`}
            key={index}
            data-reveal
          >
            {photo.src ? (
              <img
                src={assetUrl(photo.src)}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="photo-space" aria-label={`${photo.alt}，待补充`}>
                <span>0{index + 1}</span>
                <i />
              </div>
            )}
            <figcaption>
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
