/**
 * Keeps `node` visible inside its own scroll container without scrolling the
 * page, so following playback never pushes the video out of view.
 */
export function scrollWithinContainer(
  container: HTMLElement | null,
  node: HTMLElement | null | undefined,
  align: "nearest" | "center" = "nearest",
) {
  if (!container || !node) return;
  const bounds = container.getBoundingClientRect();
  const target = node.getBoundingClientRect();
  const margin = 8;
  let delta = 0;
  if (align === "center") {
    delta = target.top - bounds.top - (bounds.height - target.height) / 2;
  } else if (target.top < bounds.top + margin) {
    delta = target.top - bounds.top - margin;
  } else if (target.bottom > bounds.bottom - margin) {
    delta = target.bottom - bounds.bottom + margin;
  }
  if (!delta) return;
  container.scrollTo({
    top: container.scrollTop + delta,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
}
