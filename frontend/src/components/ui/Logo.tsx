interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  const color = variant === "dark" ? "#1A1225" : "#E8E2F0";
  const textColor = variant === "dark" ? "text-heading" : "text-on-dark";

  return (
    <a href="/" className={`flex items-center gap-2 ${className}`}>
      {/* Stylized plus/bloom icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
          fill={color}
        />
      </svg>
      <span
        className={`text-lg font-semibold tracking-tight ${textColor}`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        BloomFi
      </span>
    </a>
  );
}
