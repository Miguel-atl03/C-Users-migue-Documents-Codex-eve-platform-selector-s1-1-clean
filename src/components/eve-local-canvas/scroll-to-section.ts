/**
 * Freeze-aligned scroll helper for continuous-sheet bands (#workmap-explainer / #workmap).
 * Retries while the target mounts and re-aligns after sheetReveal animation.
 */
export function scrollToLocalCanvasSection(id: string) {
  if (typeof window === "undefined") return;

  const alignToSection = (behavior: ScrollBehavior) => {
    const element = document.getElementById(id);
    if (!element) return false;
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top), behavior });
    return true;
  };

  const tryScroll = (attemptsLeft: number) => {
    if (alignToSection("smooth")) {
      window.setTimeout(() => {
        alignToSection("auto");
      }, 520);
      return;
    }

    if (attemptsLeft > 0) {
      requestAnimationFrame(() => tryScroll(attemptsLeft - 1));
    }
  };

  requestAnimationFrame(() => tryScroll(24));
}
