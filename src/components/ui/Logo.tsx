import type { Brand } from "@/types/portfolio";

/** Header wordmark. The mark fills with scroll progress and is the intro's landing target. */
export function Logo({ brand }: { brand: Brand }) {
  return (
    <a className="logo" href="#top" data-cursor="Home" data-nav="top" aria-label="Home">
      <span className="logo__first" aria-hidden="true">
        {brand.first}
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
