"use client";

import { useEffect, useRef } from "react";
import shellStyles from "./shell-frame.module.css";

const HOST_VH_VAR = "--eve-host-vh";
const VH_UNIT_PATTERN = /(\d*\.?\d+)(?:s|d|l)?vh\b/g;
const HOST_OVERRIDES_CSS = "html { overflow: hidden; }";

type EveShellFrameProps = {
  src: string;
  title: string;
};

/**
 * Same-origin iframe sized to its content so the canvas keeps a single scroll.
 * The shell's vh units are rebound to the host viewport (otherwise they would
 * follow the iframe height and grow without end) and its window.scrollTo is
 * forwarded to the host page. The shell HTML itself is not modified on disk.
 */
export function EveShellFrame({ src, title }: EveShellFrameProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const handleLoad = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    const frame = frameRef.current;
    const win = frame?.contentWindow as (Window & typeof globalThis) | null;
    const doc = frame?.contentDocument;
    if (!frame || !win || !doc?.body) return;

    doc.querySelectorAll("style").forEach((style) => {
      const css = style.textContent ?? "";
      style.textContent = css.replace(
        VH_UNIT_PATTERN,
        `calc(var(${HOST_VH_VAR}) * $1)`,
      );
    });
    const overrides = doc.createElement("style");
    overrides.textContent = HOST_OVERRIDES_CSS;
    doc.head.appendChild(overrides);

    const syncHostViewport = () => {
      doc.documentElement.style.setProperty(
        HOST_VH_VAR,
        `${window.innerHeight / 100}px`,
      );
    };

    let heightFrame = 0;
    const syncHeight = () => {
      win.cancelAnimationFrame(heightFrame);
      heightFrame = win.requestAnimationFrame(() => {
        frame.style.height = `${Math.ceil(doc.body.scrollHeight)}px`;
      });
    };

    syncHostViewport();
    syncHeight();

    win.scrollTo = ((options?: ScrollToOptions | number, y?: number) => {
      const offset =
        typeof options === "number" ? (y ?? 0) : (options?.top ?? 0);
      const behavior =
        typeof options === "number" ? undefined : options?.behavior;
      window.scrollTo({
        top: frame.getBoundingClientRect().top + window.scrollY + offset,
        behavior,
      });
    }) as typeof win.scrollTo;

    const resizeObserver = new win.ResizeObserver(syncHeight);
    resizeObserver.observe(doc.body);
    const mutationObserver = new win.MutationObserver(syncHeight);
    mutationObserver.observe(doc.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    const handleHostResize = () => {
      syncHostViewport();
      syncHeight();
    };
    window.addEventListener("resize", handleHostResize);

    cleanupRef.current = () => {
      win.cancelAnimationFrame(heightFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", handleHostResize);
    };
  };

  return (
    <iframe
      className={shellStyles.shellFrame}
      onLoad={handleLoad}
      ref={frameRef}
      scrolling="no"
      src={src}
      title={title}
    />
  );
}
