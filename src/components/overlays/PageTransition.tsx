/** Wormhole overlay between in-page jumps; label characters are built at runtime. */
export function PageTransition() {
  return (
    <div className="trans" aria-hidden="true">
      {/* the void opens from the click point; the core flashes on the way out */}
      <div className="trans__void">
        <div className="trans__core" />
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
