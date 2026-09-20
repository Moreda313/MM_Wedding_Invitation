import { useState } from "react";
import { wedding } from "../data/wedding";
import { DayInfo } from "../components/DayInfo";
import { PixelIcon } from "../components/PixelIcon";
import { assetUrl } from "../lib/assetUrl";

export function DayTwo() {
  return (
    <div className="day-two">
      <section
        className="day-two-hero section-pad"
        id="day2"
        data-music="day2"
        tabIndex={-1}
      >
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
      </div>
      <div className="town-map" aria-label="婚礼活动地图" data-reveal>
        <div className="map-river" aria-hidden="true" />
        <div className="map-path" aria-hidden="true" />
        <div className="map-autumn" aria-hidden="true">
          <span className="map-tree tree-one"><PixelIcon name="Oak_Fall" /></span>
          <span className="map-tree tree-two"><PixelIcon name="Maple_Fall" /></span>
          <span className="map-tree tree-three"><PixelIcon name="Oak_Fall" /></span>
          <span className="map-harvest harvest-pumpkin"><PixelIcon name="Pumpkin" /></span>
          <span className="map-harvest harvest-berries"><PixelIcon name="Cranberries" /></span>
          <span className="map-harvest harvest-nut"><PixelIcon name="Hazelnut" /></span>
          <span className="map-harvest harvest-acorn"><PixelIcon name="Acorn" /></span>
          <span className="map-harvest harvest-pumpkin-small"><PixelIcon name="Pumpkin" /></span>
          {Array.from({ length: 9 }, (_, i) => <i key={i} className={`map-leaf leaf-${i + 1}`} />)}
        </div>
        {wedding.party.activities.map((activity) => (
          <button
            key={activity.id}
            data-activity={activity.id}
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
      <div className="seed-note" data-reveal>
        <div className="seed-icons" aria-hidden="true">
          <PixelIcon name="Mixed_Seeds" /><span>✧</span><PixelIcon name="Stardrop" />
        </div>
        <p>
          {wedding.ending.title.split("\n")[0]}
          <br />
          {wedding.ending.title.split("\n")[1]}
        </p>
      </div>
    </section>
  );
}
