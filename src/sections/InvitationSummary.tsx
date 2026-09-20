import { wedding } from "../data/wedding";
import { VenueActions } from "../components/VenueActions";

export function InvitationSummary() {
  return (
    <footer className="invitation-summary" id="info-summary" tabIndex={-1}
      data-music="ending" aria-labelledby="summary-title">
      <div className="summary-inner">
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
