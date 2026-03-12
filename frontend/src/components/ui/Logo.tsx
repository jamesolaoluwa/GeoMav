interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  const color = variant === "dark" ? "#1A1225" : "#E8E2F0";
  const textColor = variant === "dark" ? "text-heading" : "text-on-dark";

  return (
    <a href="/" className={`flex items-center gap-2 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Location pin */}
        <path
          d="M14 2C9.03 2 5 5.87 5 10.65C5 17.16 14 26 14 26C14 26 23 17.16 23 10.65C23 5.87 18.97 2 14 2Z"
          fill={color}
        />
        {/* Radar rings */}
        <circle cx="14" cy="10.5" r="3.5" fill="none" stroke={variant === "dark" ? "#F8F6F3" : "#1A1225"} strokeWidth="1.2" />
        <circle cx="14" cy="10.5" r="1.5" fill={variant === "dark" ? "#F8F6F3" : "#1A1225"} />
      </svg>
      <span
        className={`text-lg font-semibold tracking-tight ${textColor}`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        GeoMav
      </span>
    </a>
  );
}
