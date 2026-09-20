import type { CSSProperties } from "react";
import { memoryWall } from "../data/memory-wall";
import { assetUrl } from "../lib/assetUrl";
import "./MemoryWall.scss";

function Decoration({ name, className }: { name: string; className: string }) {
  return <img className={className} src={assetUrl(`/assets/pixel/${name}.png`)} alt="" loading="lazy" decoding="async" />;
}

export function MemoryWall() {
  return (
    <section className="memory-wall-section" id="memory-wall" data-music="party" aria-labelledby="wall-title">
      <div className="memory-wall">
        <header className="wall-heading">
          <h2 id="wall-title">{memoryWall.title}</h2>
          <p className="wall-message">{memoryWall.note}</p>
        </header>
        <div className="board-surround">
          <div className="wall-board">
            {["tl", "tr", "bl", "br"].map(corner => <i key={corner} className={`corner corner-${corner}`} aria-hidden="true" />)}
            <div className="wall-stage" role="group" aria-label="十一张合照组成的秋日照片留言板">
              <div className="memory-string" aria-hidden="true" />
              {memoryWall.photos.map(photo => (
                <figure key={photo.id} className={`snapshot ${photo.fix}`} data-photo={photo.id} style={{
                  "--x": photo.x, "--y": photo.y, "--w": photo.w, "--angle": `${photo.angle}deg`,
                  "--ratio": photo.ratio, "--position": photo.position || "center",
                  "--pin": photo.pin || "#8b9a6c", "--layer": photo.layer || 2,
                } as CSSProperties}>
                  <img src={assetUrl(`/assets/photos/wall/wall-${photo.id}.webp`)} alt={photo.alt}
                    width={["03", "04"].includes(photo.id) ? 360 : ["16", "18"].includes(photo.id) ? 270 : 480}
                    height={["03", "04", "16", "18"].includes(photo.id) ? 480 : 270}
                    loading="lazy" decoding="async" />
                </figure>
              ))}
              <div className="board-doodles" aria-hidden="true">
                <Decoration name="Stardrop" className="sticker star" />
                <Decoration name="White_Chicken" className="sticker chicken" />
                <Decoration name="Fairy_Rose" className="sticker flower" />
                <span className="small-heart" />
                <span className="leaf leaf-one" /><span className="leaf leaf-two" /><span className="leaf leaf-three" />
              </div>
            </div>
          </div>
          <div className="edge-decor" aria-hidden="true">
            <span className="wall-grass grass-left" /><span className="wall-grass grass-right" />
            <Decoration name="Maple_Fall" className="autumn-maple" />
            <Decoration name="Oak_Fall" className="autumn-tree" />
            <Decoration name="Junimo_Icon" className="little-junimo" />
            <Decoration name="Pumpkin" className="little-pumpkin" />
            <Decoration name="Acorn" className="little-acorn" />
          </div>
        </div>
      </div>
    </section>
  );
}
