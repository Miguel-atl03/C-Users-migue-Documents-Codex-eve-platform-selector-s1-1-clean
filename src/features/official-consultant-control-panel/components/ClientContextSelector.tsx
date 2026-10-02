"use client";

import { useEffect, useRef } from "react";

import type { ClientContextViewModel } from "../types/client-context.types";
import styles from "../styles/official-control-panel.module.css";
import { ActiveRelationshipSelector } from "./ActiveRelationshipSelector";
import { ClientCompanySelector } from "./ClientCompanySelector";
import { ClientContextState } from "./ClientContextState";
import { CurrentCaseSelector } from "./CurrentCaseSelector";

type ClientContextSelectorProps = {
  context: ClientContextViewModel;
  onCompanyChange: (companyId: string | null) => void;
  onRelationshipChange: (relationshipId: string | null) => void;
  onCaseChange: (caseId: string | null) => void;
  onRetry: () => void;
};

export function ClientContextSelector({
  context,
  onCompanyChange,
  onRelationshipChange,
  onCaseChange,
  onRetry,
}: ClientContextSelectorProps) {
  const relationshipRef = useRef<HTMLSelectElement>(null);
  const caseRef = useRef<HTMLSelectElement>(null);
  const pendingFocusRef = useRef<"relationship" | "case" | null>(null);

  // Hide selectors only when authentication itself prevents loading options.
  const hideSelectorsForAuthFailure =
    context.status === "error" &&
    (context.errorKind === "session" ||
      context.authReadiness === "unauthenticated");

  const isLoading =
    context.status === "loading-companies" ||
    context.status === "loading-relationships" ||
    context.status === "loading-cases" ||
    (context.companiesLoading && context.status !== "active");

  useEffect(() => {
    if (hideSelectorsForAuthFailure) return;

    if (
      pendingFocusRef.current === "relationship" &&
      context.status !== "loading-relationships" &&
      context.relationships.length > 0
    ) {
      relationshipRef.current?.focus();
      pendingFocusRef.current = null;
    }

    if (
      pendingFocusRef.current === "case" &&
      context.status !== "loading-cases" &&
      context.cases.length > 0
    ) {
      caseRef.current?.focus();
      pendingFocusRef.current = null;
    }
  }, [
    context.cases.length,
    context.relationships.length,
    context.status,
    hideSelectorsForAuthFailure,
  ]);

  if (hideSelectorsForAuthFailure) {
    return (
      <section
        className={styles.contextSelector}
        aria-label="Selección del contexto operativo"
      >
        <ClientContextState context={context} onRetry={onRetry} />
      </section>
    );
  }

  return (
    <section
      className={styles.contextSelector}
      aria-label="Selección del contexto operativo"
    >
      <div className={styles.contextSelectorGrid}>
        <ClientCompanySelector
          options={context.companies}
          value={context.selection.companyId}
          loading={isLoading && !context.selection.companyId}
          onChange={(companyId) => {
            pendingFocusRef.current = companyId ? "relationship" : null;
            onCompanyChange(companyId);
          }}
        />
        <ActiveRelationshipSelector
          ref={relationshipRef}
          options={context.relationships}
          value={context.selection.relationshipId}
          companySelected={Boolean(context.selection.companyId)}
          loading={context.status === "loading-relationships"}
          onChange={(relationshipId) => {
            pendingFocusRef.current = relationshipId ? "case" : null;
            onRelationshipChange(relationshipId);
          }}
        />
        <CurrentCaseSelector
          ref={caseRef}
          options={context.cases}
          value={context.selection.caseId}
          relationshipSelected={Boolean(context.selection.relationshipId)}
          loading={context.status === "loading-cases"}
          onChange={onCaseChange}
        />
      </div>
      <ClientContextState context={context} onRetry={onRetry} />
    </section>
  );
}
