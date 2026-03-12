import { type ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export default function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <span
      className={`text-[0.7rem] font-medium uppercase tracking-[0.1em] text-muted ${className}`}
    >
      {children}
    </span>
  );
}
