import { Fragment } from "react";

/** Two identical copies so the track can loop seamlessly at half its width. */
export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track" data-marquee="">
        {[0, 1].map((c) => (
          <div key={c} className="marquee__copy">
            {items.map((w, i) => (
              <Fragment key={i}>
                <span>{w}</span>
                <span className="marquee__gem" />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
