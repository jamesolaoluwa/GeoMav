import Image from "next/image";

interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  const isLight = variant === "light";

  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label="GeoMav home"
    >
      <Image
        src="/images/GeoMavLogo.png"
        alt="GeoMav"
        width={220}
        height={40}
        priority={variant === "dark"}
        className={`h-9 w-auto md:h-10 ${isLight ? "brightness-110" : ""}`}
      />
    </span>
  );
}
