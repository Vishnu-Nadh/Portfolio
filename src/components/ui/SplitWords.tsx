import { Fragment } from "react";

interface SplitWordsProps {
  text: string;
  className?: string;
}

/**
 * Paragraph split into masked words for the [data-words] cascade.
 * Screen readers get the full sentence via aria-label.
 */
export function SplitWords({ text, className }: SplitWordsProps) {
  const words = text.trim().split(/\s+/);
  return (
    <p className={className} data-words="" aria-label={text.trim()}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="wm" aria-hidden="true">
            <span className="wd">{w}</span>
          </span>
          {i < words.length - 1 && " "}
        </Fragment>
      ))}
    </p>
  );
}
