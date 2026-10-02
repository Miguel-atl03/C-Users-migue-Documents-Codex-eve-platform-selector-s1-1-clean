"use client";

import styles from "./eve-canvas.module.css";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Cinta infinita estilo Greven — frases de hoja, no marketing. */
export function SheetMarquee({
  items,
  className,
}: {
  items: readonly string[];
  className?: string;
}) {
  const track = [...items, ...items];

  return (
    <div
      aria-hidden="true"
      className={cx(styles.sheetMarquee, className)}
    >
      <div className={styles.sheetMarqueeTrack}>
        {track.map((item, index) => (
          <span className={styles.sheetMarqueeItem} key={`${item}-${index}`}>
            <span className={styles.sheetMarqueeDot} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
