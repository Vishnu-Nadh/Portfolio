const SIGNAL_BARS = 7;

/** Full-screen glitch layer: CRT lines (intro only), a scanline and signal bars driven by the glitch module. */
export function GlitchOverlay() {
  return (
    <div className="glx-ov" aria-hidden="true">
      <div className="glx-crt" />
      <div className="glx-scan" />
      {Array.from({ length: SIGNAL_BARS }, (_, i) => (
        <i key={i} className="glx-bar" />
      ))}
    </div>
  );
}
