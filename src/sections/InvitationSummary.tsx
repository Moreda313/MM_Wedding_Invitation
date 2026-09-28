import { useEffect, useRef, useState } from "react";
import { wedding } from "../data/wedding";
import { VenueActions } from "../components/VenueActions";
import { assetUrl } from "../lib/assetUrl";

export function InvitationSummary() {
  const coverRef = useRef<HTMLElement>(null);
  const [prepareCover, setPrepareCover] = useState(false);
  useEffect(() => {
    // Prepare during Day 2, not alongside the opening portrait and Rain.
    // Also observe the cover itself for direct summary links / navigation jumps.
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      setPrepareCover(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    const dayTwo = document.getElementById("day2");
    if (dayTwo) observer.observe(dayTwo);
    if (coverRef.current) observer.observe(coverRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <footer className="invitation-summary" id="info-summary" tabIndex={-1}
      data-music="ending" aria-labelledby="summary-title">
      <div className="summary-inner">
        <figure className="summary-cover" ref={coverRef}>
          {prepareCover && <img
            src={assetUrl("/assets/share/wedding-cover-976137ba.jpg")}
            width="1200" height="630" decoding="async" fetchPriority="low"
            alt="M & M 婚礼请柬封面：从白绿花园婚礼到星露谷秋日，2026年10月22日至23日"
          />}
        </figure>
        <header className="summary-heading">
          <h2 id="summary-title">{wedding.summary.title}</h2>
          <p>{wedding.couple.groom}<span aria-hidden="true"> & </span>{wedding.couple.bride}</p>
        </header>
        <div className="summary-days">
          {[wedding.day1, wedding.day2].map((day, index) => (
            <article className={`summary-card summary-${day.id}`} key={day.id}
              aria-labelledby={`summary-${day.id}-title`}>
              <div className="summary-date">
                <h3 id={`summary-${day.id}-title`}>
                  <time dateTime={day.date.replaceAll(".", "-")}>{day.date}</time>
                  <span>{day.weekday}</span>
                </h3>
                <p>{index === 0 ? "第一天" : "第二天"} · {day.city}</p>
              </div>
              <p className="summary-venue"><span>{day.venueLabel} · </span>{day.venue}</p>
              <p className="address">{day.address}</p>
              <p className="summary-lawn">草坪仪式 · {day.ceremonyVenue}</p>
              <dl className="summary-schedule">
                {day.schedule.map((item) => (
                  <div key={item.title}>
                    <dt>{item.time}</dt><dd>{item.title}</dd>
                  </div>
                ))}
              </dl>
              <VenueActions day={day} mapLabel={wedding.ui.navigate} />
            </article>
          ))}
        </div>
        <a className="text-link summary-top" href="#hello">
          {wedding.ending.top}<span aria-hidden="true">↑</span>
        </a>
      </div>
    </footer>
  );
}
