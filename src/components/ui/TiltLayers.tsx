/** Glare + gradient edge for a .c3d tilt card; keep these as the card's last children. */
export function TiltLayers() {
  return (
    <>
      <div className="c3d__glare" aria-hidden="true" />
      <div className="c3d__edge" aria-hidden="true" />
    </>
  );
}
