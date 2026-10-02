import styles from "./eve-logo.module.css";

export type EveLogoSize = "sm" | "md";
export type EveLogoVariant = "default" | "on-dark" | "muted";

type EveLogoProps = {
  size?: EveLogoSize;
  variant?: EveLogoVariant;
  className?: string;
};

function joinClasses(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function EveLogo({
  size = "md",
  variant = "default",
  className,
}: EveLogoProps) {
  return (
    <div
      aria-label="EVE"
      className={joinClasses(
        styles.root,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        className,
      )}
    >
      <img
        alt=""
        aria-hidden="true"
        className={styles.mark}
        src="/eve-logo.png"
      />
      <span className={styles.wordmark}>
        <span className={styles.letters}>
          EVE<sup className={styles.tm}>™</sup>
        </span>
      </span>
    </div>
  );
}
