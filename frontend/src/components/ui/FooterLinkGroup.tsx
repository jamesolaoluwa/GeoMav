interface FooterLink {
  label: string;
  href: string;
}

interface FooterLinkGroupProps {
  title: string;
  links: FooterLink[];
  className?: string;
}

export default function FooterLinkGroup({
  title,
  links,
  className = "",
}: FooterLinkGroupProps) {
  return (
    <div className={className}>
      <h4 className="text-[0.8rem] font-semibold uppercase tracking-wide text-on-dark">
        {title}
      </h4>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-[0.9rem] text-muted transition-colors duration-150 hover:text-on-dark"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
