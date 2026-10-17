const BAR_COUNT = 5;

/** Overlay used between in-page jumps; label characters are built at runtime. */
export function PageTransition() {
  return (
    <div className="trans" aria-hidden="true">
      <div className="trans__bars">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div key={i} className="trans__bar" />
        ))}
      </div>
      <div className="trans__text">
        <div className="trans__meta">
          <span>(Next)</span>
          <span className="trans__sub" />
        </div>
        <div className="trans__label" />
        <div className="trans__line" />
      </div>
    </div>
  );
}
