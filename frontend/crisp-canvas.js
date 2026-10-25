// Render a fixed-size game canvas at its displayed resolution. The backing
// store becomes an integer multiple of the logical size (times the device
// pixel ratio), and the context is scaled to match, so games keep drawing in
// logical coordinates while pixel art stays sharp and text stays legible.
export function crispCanvas(canvas, width = canvas.width, height = canvas.height) {
  const ctx = canvas.getContext('2d');
  canvas.logicalWidth = width; canvas.logicalHeight = height;
  if (typeof canvas.getBoundingClientRect !== 'function') return ctx;
  const fit = () => {
    const shown = canvas.getBoundingClientRect().width || width;
    const scale = Math.min(4, Math.max(1, Math.ceil(shown * (window.devicePixelRatio || 1) / width - .05)));
    if (canvas.width !== width * scale) { canvas.width = width * scale; canvas.height = height * scale; }
    // Resizing resets context state, so restore the transform and smoothing.
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };
  fit();
  if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(canvas);
  window.addEventListener('resize', fit);
  return ctx;
}
