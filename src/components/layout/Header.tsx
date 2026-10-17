import type { PortfolioData } from "@/types/portfolio";
import { Logo } from "@/components/ui/Logo";

type HeaderProps = Pick<PortfolioData, "brand" | "place" | "nav">;

export function Header({ brand, place, nav }: HeaderProps) {
  return (
    <header className="header">
      <Logo brand={brand} />
      <div className="header__status eyebrow">
        <span>{place}</span>
        <span>/</span>
        <span data-clock="" />
      </div>
      <nav className="header__links" aria-label="Main">
        {nav.map((l) => (
          <a
            key={l.target}
            className={l.variant === "cta" ? "header__cta" : "header__link"}
            href={`#${l.target}`}
            data-nav={l.target}
            data-cursor={l.cursor}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
