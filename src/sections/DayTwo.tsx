import { useState } from "react";
import { wedding } from "../data/wedding";
import { DayInfo } from "../components/DayInfo";
import { PixelIcon } from "../components/PixelIcon";
import { assetUrl } from "../lib/assetUrl";

export function DayTwo() {
  return (
    <div className="day-two">
      <section className="day-two-hero section-pad" id="day2" data-music="day2">
        <p className="eyebrow pixel-eyebrow">
          {wedding.day2.label} <span> / </span> {wedding.day2.date}
        </p>
        <div className="little-weather">
          <PixelIcon name="Golden_Pumpkin" />
          <span>{wedding.day2Intro.eyebrow}</span>
          <PixelIcon name="Acorn" />
        </div>
        <h2 className="preserve" data-reveal>
          {wedding.day2Intro.title}
        </h2>
        <figure className="pixel-scene" data-reveal>
          <img
            src={assetUrl(wedding.pixel.hero)}
            alt="花架下的像素新人，身旁有小狗、小猫与花草"
            width="621"
            height="482"
            loading="lazy"
            decoding="async"
          />
          <figcaption className="wood-sign">
            {wedding.day2Intro.sign}
          </figcaption>
        </figure>
        <p className="body-copy preserve">{wedding.day2Intro.note}</p>
        <div className="town-residents" aria-hidden="true">
          <PixelIcon name="White_Chicken" />
          <span />
          <PixelIcon name="Junimo_Icon" />
        </div>
      </section>
      <DayInfo day={wedding.day2} autumn />
      <PartyPreview />
    </div>
  );
}

function PartyPreview() {
  const [selected, setSelected] = useState<Set<string>>(() => {
    try {
      const stored: unknown = JSON.parse(
        sessionStorage.getItem("mm-wishes") || "[]",
      );
      return new Set(
        Array.isArray(stored)
          ? stored.filter((item): item is string => typeof item === "string")
          : [],
      );
    } catch {
      return new Set();
    }
  });
  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        sessionStorage.setItem("mm-wishes", JSON.stringify([...next]));
      } catch {
        /* private browsing */
      }
      return next;
    });
  return (
    <section
      id="party"
      className="party-preview section-pad"
      data-music="party"
    >
      <div data-reveal>
        <p className="eyebrow">{wedding.party.eyebrow}</p>
        <h2 className="preserve">{wedding.party.title}</h2>
        <p className="body-copy">{wedding.party.note}</p>
      </div>
      <div className="town-map" aria-label="婚礼活动地图" data-reveal>
        <div className="map-river" aria-hidden="true" />
        <div className="map-path" aria-hidden="true" />
        <span className="map-tree tree-one" aria-hidden="true" />
        <span className="map-tree tree-two" aria-hidden="true" />
        <span className="map-tree tree-three" aria-hidden="true" />
        {wedding.party.activities.map((activity) => (
          <button
            key={activity.id}
            className={`map-stop ${selected.has(activity.id) ? "selected" : ""}`}
            style={{ left: `${activity.x}%`, top: `${activity.y}%` }}
            onClick={() => toggle(activity.id)}
            aria-pressed={selected.has(activity.id)}
            aria-label={`${activity.name}，${selected.has(activity.id) ? wedding.party.selected : wedding.party.unselected}`}
          >
            <span className="map-icon">
              <PixelIcon name={activity.icon} />
              <span className="check" aria-hidden="true">
                ✓
              </span>
            </span>
            <span className="stop-label">{activity.name}</span>
          </button>
        ))}
      </div>
      <p className="party-footnote">{wedding.party.footer}</p>
      <div className="seed-note" data-reveal>
        <PixelIcon name="Mixed_Seeds" />
        <p>
          {wedding.ending.title.split("\n")[0]}
          <br />
          {wedding.ending.title.split("\n")[1]}
        </p>
      </div>
    </section>
  );
}
