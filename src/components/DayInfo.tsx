import { useState } from "react";
import { wedding, type WeddingDay } from "../data/wedding";
import { assetUrl } from "../lib/assetUrl";

export function DayInfo({
  day,
  autumn = false,
}: {
  day: WeddingDay;
  autumn?: boolean;
}) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(
          `${day.city} · ${day.venue} ${day.address}`,
        );
      else {
        const input = document.createElement("textarea");
        input.value = `${day.venue} ${day.address}`;
        input.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.append(input);
        input.focus();
        input.select();
        const success = document.execCommand("copy");
        input.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      setMessage(wedding.ui.copied);
    } catch {
      setMessage(wedding.ui.copyFailed);
    }
  }
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
        <p className="body-copy preserve">{day.note}</p>
      </div>
      <div className="invitation-card" data-reveal>
        <div className="date-block">
          <span className="small-label">{wedding.ui.date}</span>
          <p className="big-date">{day.date.slice(5).replace(".", " / ")}</p>
          <span className="date-year">
            2026 <span>·</span> {day.weekday}
          </span>
        </div>
        <div className="venue-block">
          <span className="small-label">{wedding.ui.location}</span>
          <h3>{day.venue}</h3>
          <p className="address">{day.address}</p>
          <div className="map-actions">
            <a href={day.mapUrl} target="_blank" rel="noreferrer">
              {wedding.ui.navigate}
              <span aria-hidden="true">↗</span>
            </a>
            <button onClick={copy}>{wedding.ui.copy}</button>
          </div>
          <p className="copy-status" role="status">
            {message}
          </p>
        </div>
        <div className="schedule">
          <span className="small-label">{wedding.ui.schedule}</span>
          {day.schedule.map((item) => (
            <div className="schedule-row" key={item.title}>
              <span>{item.time}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="live-note">
          <span aria-hidden="true">♫</span> {wedding.ui.live}
        </p>
      </div>
      <figure
        className={`venue-photo ${day.venuePhoto.src ? "has-photo" : ""}`}
        data-reveal
      >
        {day.venuePhoto.src ? (
          <img
            src={assetUrl(day.venuePhoto.src)}
            alt={day.venuePhoto.alt}
            loading="lazy"
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
          {day.venuePhoto.caption}
        </figcaption>
      </figure>
    </section>
  );
}
