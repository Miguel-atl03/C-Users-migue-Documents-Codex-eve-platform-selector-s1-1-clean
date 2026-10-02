"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import styles from "./guide-card-body.module.css";

type GuideSection =
  | { kind: "explanation"; text: string }
  | { kind: "structure"; label: string; body: string }
  | { kind: "examples"; label: string; items: string[] }
  | {
      kind: "verbs";
      label: string;
      parts: Array<
        { kind: "text"; text: string } | { kind: "chips"; text: string }
      >;
    };

function isCommaSeparatedVerbLine(line: string): boolean {
  const commaCount = (line.match(/,/g) ?? []).length;
  return commaCount >= 2 && !line.endsWith(":");
}

function parseVerbsBlock(block: string): Extract<GuideSection, { kind: "verbs" }> {
  const lines = block.split("\n");
  const label = lines[0]?.trim() ?? block;
  const parts: Extract<GuideSection, { kind: "verbs" }>["parts"] = [];
  let positiveVerbZone = false;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^Usa verbos/i.test(trimmed)) {
      positiveVerbZone = true;
      parts.push({ kind: "text", text: trimmed });
      continue;
    }

    if (/^Evita/i.test(trimmed)) {
      positiveVerbZone = false;
      const nextLine = lines[index + 1]?.trim();
      if (nextLine && isCommaSeparatedVerbLine(nextLine)) {
        parts.push({ kind: "text", text: `${trimmed}\n\n${nextLine}` });
        index += 1;
      } else {
        parts.push({ kind: "text", text: trimmed });
      }
      continue;
    }

    if (positiveVerbZone && isCommaSeparatedVerbLine(trimmed)) {
      parts.push({ kind: "chips", text: trimmed });
      positiveVerbZone = false;
      continue;
    }

    parts.push({ kind: "text", text: trimmed });
  }

  return { kind: "verbs", label, parts };
}

function parseGuideBody(body: string): GuideSection[] {
  const sections: GuideSection[] = [];

  for (const block of body.split("\n\n")) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (
      trimmed.startsWith("Usa esta estructura:") ||
      trimmed.startsWith("Usa esta idea:")
    ) {
      const newlineIndex = trimmed.indexOf("\n");
      if (newlineIndex === -1) {
        sections.push({ kind: "structure", label: trimmed, body: "" });
      } else {
        sections.push({
          kind: "structure",
          label: trimmed.slice(0, newlineIndex),
          body: trimmed.slice(newlineIndex + 1),
        });
      }
      continue;
    }

    if (/^Ejemplos? de redacción:/i.test(trimmed)) {
      const lines = trimmed.split("\n");
      sections.push({
        kind: "examples",
        label: lines[0] ?? trimmed,
        items: lines.slice(1).filter((line) => line.trim().startsWith("-")),
      });
      continue;
    }

    if (/^Verbos útiles/i.test(trimmed)) {
      sections.push(parseVerbsBlock(trimmed));
      continue;
    }

    sections.push({ kind: "explanation", text: trimmed });
  }

  return sections;
}

function splitVerbChips(line: string): string[] {
  return line
    .split(",")
    .map((verb) => verb.trim())
    .filter(Boolean);
}

function accordionTitle(section: GuideSection): string | null {
  if (section.kind === "structure") return "Estructura";
  if (section.kind === "examples") return "Ejemplos";
  if (section.kind === "verbs") return "Verbos útiles";
  return null;
}

function shouldUseAccordions(sections: GuideSection[], body: string): boolean {
  const structuredCount = sections.filter((section) => section.kind !== "explanation")
    .length;
  return structuredCount >= 2 && body.length > 320;
}

type GuideCardBodyProps = {
  body: string;
};

function StructureBlock({
  label,
  body,
  embedded = false,
}: {
  label: string;
  body: string;
  embedded?: boolean;
}) {
  return (
    <div className={styles.structureBlock}>
      {embedded ? (
        <p className={styles.structureLead}>{label}</p>
      ) : (
        <p className={styles.structureLabel}>{label}</p>
      )}
      {body ? (
        <p
          className={[
            styles.structureBody,
            body ? styles.structureBodyFormula : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

function ExamplesBlock({
  label,
  items,
  embedded = false,
}: {
  label: string;
  items: string[];
  embedded?: boolean;
}) {
  return (
    <div className={styles.examplesBlock}>
      {!embedded ? <p className={styles.sectionLabel}>{label}</p> : null}
      <ul className={styles.examplesList}>
        {items.map((item) => (
          <li className={styles.exampleItem} key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VerbsBlock({
  label,
  parts,
  embedded = false,
}: {
  label: string;
  parts: Extract<GuideSection, { kind: "verbs" }>["parts"];
  embedded?: boolean;
}) {
  return (
    <div className={styles.verbsBlock}>
      {!embedded ? <p className={styles.sectionLabel}>{label}</p> : null}
      {parts.map((part, index) => {
        if (part.kind === "chips") {
          const chips = splitVerbChips(part.text);
          return (
            <div className={styles.verbChips} key={`chips-${index}`}>
              {chips.map((chip) => (
                <span className={styles.verbChip} key={chip}>
                  {chip}
                </span>
              ))}
            </div>
          );
        }

        return (
          <p className={styles.guideText} key={`text-${index}`}>
            {part.text}
          </p>
        );
      })}
    </div>
  );
}

function GuideSectionView({
  section,
  embedded = false,
}: {
  section: GuideSection;
  embedded?: boolean;
}) {
  if (section.kind === "explanation") {
    return <p className={styles.guideText}>{section.text}</p>;
  }

  if (section.kind === "structure") {
    return (
      <StructureBlock
        body={section.body}
        embedded={embedded}
        label={section.label}
      />
    );
  }

  if (section.kind === "examples") {
    return (
      <ExamplesBlock
        embedded={embedded}
        items={section.items}
        label={section.label}
      />
    );
  }

  return (
    <VerbsBlock
      embedded={embedded}
      label={section.label}
      parts={section.parts}
    />
  );
}

function GuideAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={styles.accordion}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className={styles.accordionTrigger}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{title}</span>
        <span aria-hidden="true" className={styles.accordionIcon}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className={styles.accordionPanel} id={panelId}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function GuideCardBody({ body }: GuideCardBodyProps) {
  const sections = useMemo(() => parseGuideBody(body), [body]);
  const useAccordions = useMemo(
    () => shouldUseAccordions(sections, body),
    [body, sections],
  );

  if (!useAccordions) {
    return (
      <div className={styles.guideBody}>
        {sections.map((section, index) => (
          <GuideSectionView key={`${section.kind}-${index}`} section={section} />
        ))}
      </div>
    );
  }

  let structuredIndex = 0;

  return (
    <div className={styles.guideBody}>
      {sections.map((section, index) => {
        if (section.kind === "explanation") {
          return (
            <GuideSectionView
              key={`explanation-${index}`}
              section={section}
            />
          );
        }

        const title = accordionTitle(section);
        const defaultOpen = structuredIndex === 0;
        structuredIndex += 1;

        return (
          <GuideAccordion
            defaultOpen={defaultOpen}
            key={`${section.kind}-${index}`}
            title={title ?? ""}
          >
            <GuideSectionView embedded section={section} />
          </GuideAccordion>
        );
      })}
    </div>
  );
}
