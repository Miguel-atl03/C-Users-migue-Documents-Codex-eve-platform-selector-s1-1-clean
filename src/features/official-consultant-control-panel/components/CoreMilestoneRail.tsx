"use client";



import { useEffect, useRef, type KeyboardEvent } from "react";



import type { CoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";

import { formatCoreMilestoneAriaAnnouncement } from "../presentation/core-milestone-axis-presentation";

import styles from "../styles/official-control-panel.module.css";

import type { CoreMilestoneAxisViewModel } from "../types/core-milestone-axis.types";
import type { OfficialPanelScreenState } from "@/services/eve/official-control-panel/official-control-panel-contract.types";



type CoreMilestoneRailProps = {
  axis: CoreMilestoneAxisViewModel;
  onSelectMilestone: (code: CoreMilestoneCode) => void;
  onRetry?: () => void;
  screenState?: OfficialPanelScreenState;
  requestId?: string | null;
};



function milestoneCodeSelector(code: string): string {

  return `[data-milestone-code="${code.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;

}



/**

 * Eje Y — patrón a11y: nav → lista → button aria-pressed (sin role=option).

 * Home/End mueven foco; Enter/Space seleccionan (URL + detalle sincronizados).

 */

export function CoreMilestoneRail({
  axis,
  onSelectMilestone,
  onRetry,
  screenState = "ready",
}: CoreMilestoneRailProps) {

  const listRef = useRef<HTMLUListElement>(null);



  useEffect(() => {

    if (!axis.selectedCode || !listRef.current) return;

    const selected = listRef.current.querySelector<HTMLElement>(

      milestoneCodeSelector(axis.selectedCode),

    );

    selected?.focus();

  }, [axis.selectedCode]);



  const handleKeyDown = (

    event: KeyboardEvent<HTMLButtonElement>,

    code: CoreMilestoneCode,

  ) => {

    const codes = axis.items.map((item) => item.code);

    const index = codes.indexOf(code);

    if (index < 0) return;



    if (event.key === "Enter" || event.key === " ") {

      event.preventDefault();

      onSelectMilestone(code);

      return;

    }



    if (event.key === "Home") {

      event.preventDefault();

      const first = codes[0];

      if (first) {

        listRef.current

          ?.querySelector<HTMLElement>(milestoneCodeSelector(first))

          ?.focus();

      }

      return;

    }



    if (event.key === "End") {

      event.preventDefault();

      const last = codes[codes.length - 1];

      if (last) {

        listRef.current

          ?.querySelector<HTMLElement>(milestoneCodeSelector(last))

          ?.focus();

      }

      return;

    }



    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();

    const delta = event.key === "ArrowDown" ? 1 : -1;

    const next = codes[(index + delta + codes.length) % codes.length];

    if (!next) return;

    listRef.current

      ?.querySelector<HTMLElement>(milestoneCodeSelector(next))

      ?.focus();

  };



  return (

    <nav

      className={styles.railY}

      aria-labelledby="core-milestone-rail-heading"

      data-testid="core-milestone-rail"

      data-screen-state={screenState}

    >

      <h2 className={styles.railYTitle} id="core-milestone-rail-heading">

        Hitos core del caso

      </h2>



      {axis.status === "idle" ? (

        <p className={styles.milestoneContextNote} role="status">

          <span aria-hidden="true">!</span>{" "}
          Seleccione un caso en curso para consultar hitos core.

        </p>

      ) : null}



      {axis.status === "loading" ? (

        <p

          className={styles.milestoneContextNote}

          role="status"

          data-milestone-loading="initial"

        >

          <span aria-hidden="true">!</span>{" "}
          Cargando hitos core…

        </p>

      ) : null}



      {axis.refreshing ? (

        <p

          className={styles.milestoneContextNote}

          role="status"

          data-milestone-loading="refresh"

        >

          Actualizando hitos…

        </p>

      ) : null}



      {axis.status === "error" ? (

        <p className={styles.milestoneContextNote} role="alert">

          {axis.errorMessage}{" "}

          {onRetry ? (

            <button type="button" onClick={onRetry}>

              Reintentar

            </button>

          ) : null}

        </p>

      ) : null}



      {axis.items.length > 0 ? (

        <ul className={styles.milestoneList} ref={listRef}>

          {axis.items.map((item) => {

            const selected = axis.selectedCode === item.code;

            const className = [

              styles.milestoneItemButton,

              item.uiState === "reached" ? styles.milestoneItemCompleted : "",

              selected ? styles.milestoneItemSelected : "",

            ]

              .filter(Boolean)

              .join(" ");



            return (

              <li key={item.code}>

                <button

                  type="button"

                  className={className}

                  data-milestone-code={item.code}

                  aria-pressed={selected}

                  aria-label={formatCoreMilestoneAriaAnnouncement(

                    item,

                    selected,

                  )}

                  onClick={() => onSelectMilestone(item.code)}

                  onKeyDown={(event) => handleKeyDown(event, item.code)}

                >

                  <span

                    className={styles.milestoneIndicator}

                    aria-hidden="true"

                  />

                  <span className={styles.milestoneItemBody}>

                    <span className={styles.milestoneItemCode}>{item.code}</span>

                    <span className={styles.milestoneItemLabel}>

                      {item.label}

                    </span>

                    <span className={styles.milestoneItemMeta}>

                      {item.uiStateLabel}

                      {item.modalityLabel ? ` · ${item.modalityLabel}` : ""}

                    </span>

                  </span>

                </button>

              </li>

            );

          })}

        </ul>

      ) : null}



      {axis.finalAlternative ? (

        <p
          className={styles.milestoneContextNote}
          role="status"
          data-testid="core-final-alternative"
          data-final-alternative={axis.finalAlternative}
        >

          Salida alternativa del caso: {axis.finalAlternative}

          {axis.finalAlternativeReason ? (
            <span data-testid="core-final-alternative-reason">
              {" "}
              — motivo: {axis.finalAlternativeReason}
            </span>
          ) : null}

        </p>

      ) : null}

    </nav>

  );

}


