import type { Brand } from "@/types/portfolio";

/**
 * Header wordmark: [V]ISHNU [N]adh. The first letter sits in an accent box; the mark box fills
 * with scroll progress.
 */
export function Logo({ brand }: { brand: Brand }) {
  const [initial, ...rest] = [...brand.first];
  return (
    <a className="logo" href="#top" data-cursor="Home" data-nav="top" aria-label="Home">
      <span className="logo__first" aria-hidden="true">
        <span className="logo__box" style={{ marginLeft: 0 }}>
          {initial}
        </span>
        {rest.join("")}
      </span>
      <span className="logo__mark" aria-hidden="true">
        <span className="logo__fill" />
        <span className="logo__ch">{brand.mark}</span>
      </span>
      <span className="logo__rest" aria-hidden="true">
        {brand.rest}
      </span>
    </a>
  );
}
