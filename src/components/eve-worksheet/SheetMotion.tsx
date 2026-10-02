"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./worksheet.module.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type MotionVariant = "lift" | "title" | "band";

/** Presentational scroll reveal — no runtime authority. */
export function SheetMotion({
  children,
  className,
  stagger = false,
  delayMs = 0,
  variant = "lift",
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  delayMs?: number;
  variant?: MotionVariant;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(prefersReducedMotion);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cx(
        styles.motionReveal,
        variant === "title" && styles.motionRevealTitle,
        variant === "band" && styles.motionRevealBand,
        inView && styles.motionRevealIn,
        stagger && styles.motionStagger,
        className,
      )}
      ref={ref}
      style={
        delayMs
          ? ({ ["--motion-delay"]: `${delayMs}ms` } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
