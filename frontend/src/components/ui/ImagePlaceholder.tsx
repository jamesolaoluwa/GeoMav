interface ImagePlaceholderProps {
  label?: string;
  aspectRatio?: string;
  className?: string;
}

export default function ImagePlaceholder({
  label = "Image placeholder",
  aspectRatio = "16/7",
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      {/* Base atmospheric gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #E8E2F0 0%, #C4B8D9 30%, #8B7CB5 60%, #5C4F7A 100%)",
        }}
      />
      {/* Central light bloom for depth-of-field feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.22) 0%, transparent 60%)",
        }}
      />
      {/* Organic shape hints */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: [
            "radial-gradient(ellipse at 20% 75%, #9B8FBF 0%, transparent 35%)",
            "radial-gradient(ellipse at 80% 65%, #B8A9D4 0%, transparent 30%)",
            "radial-gradient(ellipse at 50% 85%, #7B6CA5 0%, transparent 28%)",
            "radial-gradient(circle at 35% 50%, rgba(200,190,220,0.4) 0%, transparent 25%)",
            "radial-gradient(circle at 65% 55%, rgba(180,170,210,0.3) 0%, transparent 22%)",
          ].join(", "),
        }}
      />
      {/* Subtle top-edge mist blending into the page background */}
      <div
        className="absolute inset-x-0 top-0 h-1/4"
        style={{
          background:
            "linear-gradient(180deg, var(--color-page) 0%, transparent 100%)",
        }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium tracking-wide text-white/40 uppercase">
        {label}
      </span>
    </div>
  );
}
