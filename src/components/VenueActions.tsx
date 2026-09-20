import { useState } from "react";
import { wedding, type WeddingDay } from "../data/wedding";

export function VenueActions({ day }: { day: WeddingDay }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      const text = `${day.city} · ${day.venue} ${day.address}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("textarea");
        input.value = text;
        input.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.append(input);
        let success = false;
        try {
          input.focus();
          input.select();
          success = document.execCommand("copy");
        } finally {
          input.remove();
        }
        if (!success) throw new Error("Clipboard unavailable");
      }
      setMessage(wedding.ui.copied);
    } catch {
      setMessage(wedding.ui.copyFailed);
    }
  }
  return (
    <>
      <div className="map-actions">
        <a href={day.mapUrl} target="_blank" rel="noreferrer"
          aria-label={`${wedding.ui.navigate}：${day.city} · ${day.venue}`}>
          {day.mapLabel}<span aria-hidden="true">↗</span>
        </a>
        <button onClick={copy} aria-label={`${wedding.ui.copy}：${day.venue}`}>
          {wedding.ui.copy}
        </button>
      </div>
      <p className="copy-status" role="status">{message}</p>
    </>
  );
}
