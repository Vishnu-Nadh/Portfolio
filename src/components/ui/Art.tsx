import { artBackground } from "@/lib/format";

interface ArtProps {
  num: string;
  tag: string;
  hue: number;
  label: string;
}

/** Placeholder artwork tile: swap for <Image> once real project shots exist. */
export function Art({ num, tag, hue, label }: ArtProps) {
  return (
    <div className="art" style={{ background: artBackground(hue) }}>
      <span className="art__tag">{label}</span>
      <span className="art__num">{num}</span>
      <span className="art__tag">{tag}</span>
    </div>
  );
}
