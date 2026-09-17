import { assetUrl } from "../lib/assetUrl";

export function PixelIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  if (name === "tennis")
    return (
      <svg
        className={`pixel-icon ${className}`}
        viewBox="0 0 24 24"
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        <path
          fill="#627647"
          d="M10 2h8v2h2v2h2v8h-2v2h-2v2h-8v-2H8v-2H6V6h2V4h2z"
        />
        <path fill="#ebd7a0" d="M10 6h8v8h-8z" />
        <path stroke="#627647" d="M12 6v8m3-8v8m-5-5h8m-8 3h8" />
        <path fill="#8f533a" d="M8 16h4v4H8v2H4v-4h4z" />
      </svg>
    );
  return (
    <img
      className={`pixel-icon ${className}`}
      src={assetUrl(`/assets/pixel/${name}.png`)}
      alt=""
      width="48"
      height="48"
      loading="lazy"
      decoding="async"
    />
  );
}
