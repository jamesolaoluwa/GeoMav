interface CheckItemProps {
  children: string;
  className?: string;
  dark?: boolean;
}

export default function CheckItem({ children, className = "", dark = false }: CheckItemProps) {
  return (
    <li className={`flex items-start gap-3 ${className}`}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`mt-0.5 shrink-0 ${dark ? "text-accent-lavender" : "text-accent-green"}`}
        aria-hidden="true"
      >
        <path
          d="M6 10L9 13L14 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`text-[0.9rem] leading-relaxed ${dark ? "text-white/70" : "text-body"}`}>
        {children}
      </span>
    </li>
  );
}
