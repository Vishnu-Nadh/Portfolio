/** Fixed WebGL stage behind the page (drawn by the scene3d module) and the CSS orb shown until it is ready. */
export function Scene3D() {
  return (
    <>
      <div className="gl3d__poster" aria-hidden="true" />
      <canvas className="gl3d" aria-hidden="true" />
    </>
  );
}
