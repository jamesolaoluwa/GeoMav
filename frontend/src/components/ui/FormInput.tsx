"use client";

import { useState } from "react";

interface FormInputProps {
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  id: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function FormInput({
  label,
  type = "text",
  placeholder,
  helperText,
  required = false,
  id,
  name,
  value,
  onChange,
  className = "",
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="text-[0.85rem] font-medium text-heading"
      >
        {label}
      </label>

      <div className="relative">
        <input
          type={inputType}
          id={id}
          name={name || id}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-border-default bg-white px-4 py-3 text-[0.95rem] text-heading outline-none transition-colors placeholder:text-muted focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/30"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted transition-colors hover:text-body"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[0.75rem] text-muted">{helperText}</p>
      )}
    </div>
  );
}
