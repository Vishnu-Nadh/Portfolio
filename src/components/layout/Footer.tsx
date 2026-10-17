import type { PortfolioData } from "@/types/portfolio";
import { SplitWords } from "@/components/ui/SplitWords";

type FooterProps = Pick<PortfolioData, "footer" | "place" | "toasts">;

export function Footer({ footer, place, toasts }: FooterProps) {
  return (
    <footer className="foot" id="contact">
      <div className="foot__cta">
        <SplitWords className="foot__big" text={footer.headline} />
        <a className="btn btn--solid" href="#contact" data-magnet="" data-cursor="Say hi" data-toast={toasts.contact}>
          {footer.cta}
        </a>
      </div>
      <div className="foot__bar eyebrow">
        <span>{place}</span>
        <span data-clock="" />
        <button type="button" data-replay="">
          {footer.replay}
        </button>
        <button type="button" data-totop="">
          {footer.toTop}
        </button>
      </div>
    </footer>
  );
}
