"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActivityBoundarySectionReview,
  BoundarySectionConfirmationStatus,
} from "@/services/operational-description-coach/infer-activity-boundary";
import type { ActivityBoundaryReview } from "@/services/operational-description-coach/infer-activity-boundary";
import styles from "./significado-de-tu-trabajo.module.css";

type Props = {
  disabled?: boolean;
  getSectionStatus: (
    sectionId: ActivityBoundarySectionReview["id"],
  ) => BoundarySectionConfirmationStatus;
  getSectionValue: (
    sectionId: ActivityBoundarySectionReview["id"],
  ) => string;
  onSectionConfirm: (sectionId: ActivityBoundarySectionReview["id"]) => void;
  onSectionManualChange: (
    sectionId: ActivityBoundarySectionReview["id"],
    value: string,
  ) => void;
  onSectionRequestCorrection: (
    sectionId: ActivityBoundarySectionReview["id"],
  ) => void;
  review: ActivityBoundaryReview;
};

function isSectionResolved(status: BoundarySectionConfirmationStatus, value: string) {
  return (
    Boolean(value.trim()) && (status === "confirmed" || status === "manual")
  );
}

function BoundarySectionCard({
  disabled,
  onConfirm,
  onManualChange,
  onRequestCorrection,
  section,
  sectionStatus,
  sectionValue,
}: {
  disabled?: boolean;
  onConfirm: () => void;
  onManualChange: (value: string) => void;
  onRequestCorrection: () => void;
  section: ActivityBoundarySectionReview;
  sectionStatus: BoundarySectionConfirmationStatus;
  sectionValue: string;
}) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolved = isSectionResolved(sectionStatus, sectionValue);

  useEffect(() => {
    if (!editing) {
      return;
    }

    textareaRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (sectionStatus === "confirmed" || sectionStatus === "manual") {
      setEditing(false);
    }
  }, [sectionStatus]);

  const handleStartEdit = () => {
    setEditing(true);
    onRequestCorrection();
  };

  const canConfirm = Boolean(
    sectionValue.trim() || section.inferredSnippet?.trim(),
  );

  const handleConfirm = () => {
    if (!canConfirm) {
      return;
    }

    setEditing(false);
    onConfirm();
  };

  const inEditMode =
    editing ||
    (sectionStatus === "pending" && Boolean(sectionValue.trim())) ||
    (!section.isSufficient &&
      sectionStatus !== "confirmed" &&
      sectionStatus !== "manual");

  const showReadOnly = resolved && !editing;

  const showConfirmation =
    !showReadOnly &&
    !inEditMode &&
    section.isSufficient &&
    Boolean(section.inferredSnippet) &&
    sectionStatus === "pending";

  if (showReadOnly) {
    return (
      <section className={styles.boundarySectionCard}>
        <div className={styles.boundarySectionHeader}>
          <p className={styles.boundarySectionTitle}>{section.sectionLabel}</p>
          <span className={styles.boundarySectionSummaryState}>Listo</span>
        </div>
        <p className={styles.boundarySectionSnippet}>{sectionValue}</p>
        <button
          className={styles.boundaryCorrectButton}
          disabled={disabled}
          onClick={handleStartEdit}
          type="button"
        >
          Quiero corregirlo
        </button>
      </section>
    );
  }

  if (showConfirmation) {
    return (
      <section className={styles.boundarySectionCard}>
        <p className={styles.boundarySectionTitle}>{section.sectionLabel}</p>
        <p className={styles.boundarySectionPrompt}>{section.confirmPrompt}</p>
        <p className={styles.boundarySectionSnippet}>{section.inferredSnippet}</p>
        <div className={styles.boundaryConfirmationActions}>
          <button
            className={styles.boundaryConfirmButton}
            disabled={disabled || !canConfirm}
            onClick={handleConfirm}
            type="button"
          >
            Sí, es correcto
          </button>
          <button
            className={styles.boundaryCorrectButton}
            disabled={disabled}
            onClick={handleStartEdit}
            type="button"
          >
            Quiero corregirlo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.boundarySectionCard}>
      <p className={styles.boundarySectionTitle}>{section.sectionLabel}</p>
      <p className={styles.boundarySectionPrompt}>{section.manualPrompt}</p>
      <textarea
        ref={textareaRef}
        className={styles.textareaInput}
        disabled={disabled}
        onChange={(event) => onManualChange(event.target.value)}
        placeholder="Escribe aquí"
        value={sectionValue}
      />
      <div className={styles.boundaryConfirmationActions}>
        <button
          className={styles.boundaryConfirmButton}
          disabled={disabled || !sectionValue.trim()}
          onClick={handleConfirm}
          type="button"
        >
          Sí, es correcto
        </button>
      </div>
    </section>
  );
}

export function ActivityBoundaryConfirmationPanel({
  disabled = false,
  getSectionStatus,
  getSectionValue,
  onSectionConfirm,
  onSectionManualChange,
  onSectionRequestCorrection,
  review,
}: Props) {
  if (review.waitingForOperationalDescription) {
    return (
      <p className={styles.boundaryWaitingMessage} role="status">
        Primero escribe arriba la descripción operativa. Después podrás revisar
        aquí el inicio y el cierre.
      </p>
    );
  }

  return (
    <div className={styles.boundarySectionsPanel}>
      {review.sections.map((section) => (
        <BoundarySectionCard
          disabled={disabled}
          key={section.id}
          onConfirm={() => onSectionConfirm(section.id)}
          onManualChange={(value) => onSectionManualChange(section.id, value)}
          onRequestCorrection={() => onSectionRequestCorrection(section.id)}
          section={section}
          sectionStatus={getSectionStatus(section.id)}
          sectionValue={getSectionValue(section.id)}
        />
      ))}
    </div>
  );
}
