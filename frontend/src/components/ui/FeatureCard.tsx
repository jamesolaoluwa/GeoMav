"use client";

import { type ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  image?: ReactNode;
  isExpanded: boolean;
  onHover?: () => void;
  className?: string;
}

export default function FeatureCard({
  title,
  description,
  image,
  isExpanded,
  onHover,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      onMouseEnter={onHover}
      className={`relative flex flex-col overflow-hidden rounded-[var(--radius-card)] transition-all duration-500 ease-out ${className}`}
    >
      {/* Background layer: image when expanded, solid dark when collapsed */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out ${
          isExpanded ? "opacity-100" : "opacity-0"
        }`}
      >
        {image}
      </div>

      {/* Solid dark background when collapsed */}
      <div
        className={`absolute inset-0 z-0 bg-card-dark transition-opacity duration-500 ease-out ${
          isExpanded ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Gradient overlay for text readability when image is showing */}
      <div
        className={`absolute inset-0 z-[1] transition-opacity duration-500 ease-out ${
          isExpanded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(90deg, rgba(248,246,243,0.95) 0%, rgba(248,246,243,0.8) 35%, rgba(248,246,243,0.3) 65%, transparent 100%)",
        }}
      />

      {/* Text content */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-6 md:p-7 lg:p-8">
        <h3
          className={`max-w-[220px] text-[1.2rem] font-semibold leading-snug tracking-tight transition-colors duration-500 md:text-[1.35rem] lg:text-[1.5rem] ${
            isExpanded ? "text-heading" : "text-white"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-auto max-w-[260px] pt-5 text-[0.82rem] font-semibold leading-relaxed transition-colors duration-500 md:text-[0.87rem] lg:text-[0.9rem] ${
            isExpanded ? "text-body" : "text-white/80"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
