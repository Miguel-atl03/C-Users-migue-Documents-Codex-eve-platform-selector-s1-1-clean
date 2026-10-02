"use client";

import {
  WORKMAP_ROLE_HELP_PARAGRAPHS,
  type WorkMapRoleHelpMaterialityShard,
  type WorkMapRoleHelpVariant,
} from "@/config/workmap-role-help-copy";
import { IBM_Plex_Mono } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./local-canvas-workmap.module.css";
import type { WorkMapRoleHelpShardPlacement } from "./workmap-role-help-materiality";

const ENTER_MS = 360;
const EXIT_MS = 280;

/** Referencia tipográfica canónica — IBM Plex Mono, Title Case, bloque denso. */
const workMapRoleHelpMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

type PortalPhase = "entering" | "open" | "exiting";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SHARD_PLACEMENT_CLASS: Record<WorkMapRoleHelpShardPlacement, string> = {
  workmapRoleHelpShardT1: styles.workmapRoleHelpShardT1,
  workmapRoleHelpShardT2: styles.workmapRoleHelpShardT2,
  workmapRoleHelpShardT3: styles.workmapRoleHelpShardT3,
  workmapRoleHelpShardT4: styles.workmapRoleHelpShardT4,
  workmapRoleHelpShardT5: styles.workmapRoleHelpShardT5,
  workmapRoleHelpShardB1: styles.workmapRoleHelpShardB1,
  workmapRoleHelpShardB2: styles.workmapRoleHelpShardB2,
  workmapRoleHelpShardB3: styles.workmapRoleHelpShardB3,
  workmapRoleHelpShardB4: styles.workmapRoleHelpShardB4,
  workmapRoleHelpShardL1: styles.workmapRoleHelpShardL1,
  workmapRoleHelpShardL2: styles.workmapRoleHelpShardL2,
  workmapRoleHelpShardL3: styles.workmapRoleHelpShardL3,
  workmapRoleHelpShardR1: styles.workmapRoleHelpShardR1,
  workmapRoleHelpShardR2: styles.workmapRoleHelpShardR2,
  workmapRoleHelpShardR3: styles.workmapRoleHelpShardR3,
};

export type WorkMapRoleHelpPortalProps = {
  open: boolean;
  onClose: () => void;
  closeLabel?: string;
  variant: WorkMapRoleHelpVariant;
  shards?: WorkMapRoleHelpMaterialityShard[];
};

function MaterialityShards({ shards }: { shards: WorkMapRoleHelpMaterialityShard[] }) {
  return (
    <>
      {shards.map((shard) => (
        <p
          className={cx(
            styles.workmapRoleHelpShard,
            SHARD_PLACEMENT_CLASS[shard.placement as WorkMapRoleHelpShardPlacement],
            shard.emphasis && styles.workmapRoleHelpShardNear,
          )}
          key={shard.id}
        >
          {shard.label}
        </p>
      ))}
    </>
  );
}

function HelpStack({
  closeLabel,
  onClose,
  phase,
  variant,
}: {
  closeLabel: string;
  onClose: () => void;
  phase: PortalPhase;
  variant: WorkMapRoleHelpVariant;
}) {
  return (
    <div
      className={cx(
        styles.workmapRoleHelpStack,
        workMapRoleHelpMono.className,
        variant === "voidTotal" && styles.workmapRoleHelpStackVoidTotal,
      )}
    >
      <h2 className={styles.workmapRoleHelpSrTitle} id="workmap-role-help-title">
        Ayuda sobre tu rol funcional
      </h2>
      {WORKMAP_ROLE_HELP_PARAGRAPHS.map((paragraph) => (
        <p className={styles.workmapRoleHelpInscription} key={paragraph.slice(0, 24)}>
          {paragraph}
        </p>
      ))}
      <button
        className={styles.workmapRoleHelpClose}
        disabled={phase === "exiting"}
        onClick={onClose}
        type="button"
      >
        {closeLabel}
      </button>
    </div>
  );
}

/** Opción 1 — portal con materialidad en perímetro; mapa visible detrás. */
function EdgesPortal({
  closeLabel,
  onClose,
  phase,
  phaseClass,
  shards,
}: {
  closeLabel: string;
  onClose: () => void;
  phase: PortalPhase;
  phaseClass: string;
  shards: WorkMapRoleHelpMaterialityShard[];
}) {
  return (
    <div
      aria-labelledby="workmap-role-help-title"
      aria-modal="true"
      className={cx(
        styles.workmapRoleHelpOverlay,
        styles.workmapRoleHelpOverlayEdges,
        phaseClass,
      )}
      role="dialog"
    >
      <div className={styles.workmapRoleHelpStage}>
        {shards.length > 0 ? (
          <div aria-hidden="true" className={styles.workmapRoleHelpMaterialityRing}>
            <MaterialityShards shards={shards} />
          </div>
        ) : null}
        <HelpStack
          closeLabel={closeLabel}
          onClose={onClose}
          phase={phase}
          variant="edges"
        />
      </div>
    </div>
  );
}

/** Opción 2 — void total; sin materialidad visible en transición. */
function VoidTotalPortal({
  closeLabel,
  onClose,
  phase,
  phaseClass,
}: {
  closeLabel: string;
  onClose: () => void;
  phase: PortalPhase;
  phaseClass: string;
}) {
  return (
    <div
      aria-labelledby="workmap-role-help-title"
      aria-modal="true"
      className={cx(
        styles.workmapRoleHelpOverlay,
        styles.workmapRoleHelpOverlayVoidTotal,
        phaseClass,
      )}
      role="dialog"
    >
      <div aria-hidden="true" className={styles.workmapRoleHelpVoidSheet} />
      <HelpStack
        closeLabel={closeLabel}
        onClose={onClose}
        phase={phase}
        variant="voidTotal"
      />
    </div>
  );
}

export function WorkMapRoleHelpPortal({
  open,
  onClose,
  closeLabel = "Cerrar",
  variant,
  shards = [],
}: WorkMapRoleHelpPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<PortalPhase>("entering");
  const mountedRef = useRef(false);

  useEffect(() => {
    let timer: number | undefined;

    if (open) {
      mountedRef.current = true;
      setMounted(true);
      setPhase("entering");
      timer = window.setTimeout(() => {
        setPhase("open");
      }, ENTER_MS);
    } else if (mountedRef.current) {
      setPhase("exiting");
      timer = window.setTimeout(() => {
        mountedRef.current = false;
        setMounted(false);
      }, EXIT_MS);
    }

    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverflowX = body.style.overflowX;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverflowX = documentElement.style.overflowX;

    body.style.overflow = "hidden";
    body.style.overflowX = "hidden";
    documentElement.style.overflow = "hidden";
    documentElement.style.overflowX = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overflowX = previousBodyOverflowX;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overflowX = previousHtmlOverflowX;
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const phaseClass =
    phase === "entering"
      ? styles.workmapRoleHelpPhaseEntering
      : phase === "open"
        ? styles.workmapRoleHelpPhaseOpen
        : styles.workmapRoleHelpPhaseExiting;

  const portal =
    variant === "edges" ? (
      <EdgesPortal
        closeLabel={closeLabel}
        onClose={onClose}
        phase={phase}
        phaseClass={phaseClass}
        shards={shards}
      />
    ) : (
      <VoidTotalPortal
        closeLabel={closeLabel}
        onClose={onClose}
        phase={phase}
        phaseClass={phaseClass}
      />
    );

  return createPortal(portal, document.body);
}
