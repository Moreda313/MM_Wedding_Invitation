import { wedding, type WeddingDay } from "../data/wedding";
import { assetUrl } from "../lib/assetUrl";
import { VenueActions } from "./VenueActions";

export function DayInfo({
  day,
  autumn = false,
}: {
  day: WeddingDay;
  autumn?: boolean;
}) {
  return (
    <section
      className={`day-info section-pad ${autumn ? "autumn-info" : ""}`}
      id={`${day.id}-info`}
      aria-label={`${day.label} ${wedding.ui.itinerary}`}
    >
      <div className="info-heading" data-reveal>
        <p className="eyebrow">
          {day.label} <span> / </span> {day.city}
        </p>
        <h2>{day.title}</h2>
      </div>
      <figure
        className={`venue-photo ${day.venuePhoto.src ? "has-photo" : ""}`}
        data-reveal
      >
        {day.venuePhoto.src ? (
          <img
            src={assetUrl(day.venuePhoto.src)}
            srcSet={day.venuePhoto.srcSet?.map((image) => `${assetUrl(image.src)} ${image.width}w`).join(", ")}
            sizes="(min-width: 860px) 730px, (min-width: 700px) calc(100vw - 130px), calc(100vw - 52px)"
            width={day.venuePhoto.width}
            height={day.venuePhoto.height}
            alt={day.venuePhoto.alt}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="venue-placeholder"
            aria-label={`${day.venuePhoto.alt}，待补充`}
          >
            <span className="arch-line" />
            <span className="ground-line" />
          </div>
        )}
        <figcaption>
          <span>{wedding.ui.venue}</span>
          {day.ceremonyVenue}
        </figcaption>
        {day.venuePhoto.full && (
          <a className="venue-full text-link" href={assetUrl(day.venuePhoto.full)}
            target="_blank" rel="noreferrer" aria-label={`${day.ceremonyVenue}：${wedding.ui.viewVenue}`}>
            {wedding.ui.viewVenue}<span aria-hidden="true">↗</span>
          </a>
        )}
      </figure>
      <p className="body-copy preserve venue-invitation" data-reveal>{day.note}</p>
      <div className="invitation-card" data-reveal>
        <div className="date-block">
          <span className="small-label">{wedding.ui.date}</span>
          <p className="big-date">{day.date.slice(5).replace(".", " / ")}</p>
          <span className="date-year">
            2026 <span>·</span> {day.weekday}
          </span>
        </div>
        <div className="venue-block">
          <span className="small-label">{day.venueLabel}</span>
          <h3>{day.venue}</h3>
          <p className="address">{day.address}</p>
          <VenueActions day={day} />
        </div>
        <div className="schedule">
          <span className="small-label">{wedding.ui.schedule}</span>
          {day.schedule.map((item) => (
            <div className="schedule-row" key={item.title}>
              <span>{item.time}</span>
              <div>
                <strong>{item.title}</strong>
                {item.note && <p>{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
