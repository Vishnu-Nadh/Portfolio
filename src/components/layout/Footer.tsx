import type { PortfolioData } from "@/types/portfolio";
import { SplitWords } from "@/components/ui/SplitWords";

type FooterProps = Pick<PortfolioData, "footer" | "place" | "toasts">;

/** Contact "event horizon": the CTA sits at the edge of an accretion disk around the parked 3D orb. */
export function Footer({ footer, place, toasts }: FooterProps) {
  return (
    <footer className="foot" id="contact">
      <div className="foot__cta">
        <SplitWords className="foot__big" text={footer.headline} />
        <div className="hz" data-hz="">
          <div className="hz__disk hz__disk--2" aria-hidden="true" />
          <div className="hz__disk" aria-hidden="true" />
          <span className="hz__core" aria-hidden="true" />
          <a className="btn btn--solid hz__btn" href="#contact" data-magnet="" data-cursor="Say hi" data-toast={toasts.contact}>
            {footer.cta}
          </a>
        </div>
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
