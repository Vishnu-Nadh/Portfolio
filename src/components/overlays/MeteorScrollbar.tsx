/** Custom scrollbar: dotted rail, burnt travelled path and a meteor thumb (driven by the meteor module). */
export function MeteorScrollbar() {
  return (
    <div className="mtr" data-mtr="" aria-hidden="true">
      <div className="mtr__path" />
      <div className="mtr__burn" data-mburn="" />
      <div className="mtr__m" data-mm="">
        <div className="mtr__tail" data-mtail="" />
        <div className="mtr__head" />
      </div>
    </div>
  );
}
