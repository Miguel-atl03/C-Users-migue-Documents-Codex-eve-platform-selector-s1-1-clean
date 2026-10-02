"use client";



import type { CoreMilestoneCode } from "@/services/eve/official-control-panel/catalogs/core-milestone-axis.catalog";

import type { SupportProcessAxisCode } from "@/services/eve/official-control-panel/catalogs/support-process-axis.catalog";

import {

  XY_CLIENT_BORDER_ROW,

  XY_MATRIX_MILESTONE_COLUMNS,

  XY_RELATION_LEGEND,

  XY_SUPPORT_MATRIX_ROWS,

  getXyRelationCode,

} from "@/services/eve/official-control-panel/catalogs/xy-interaction-matrix.catalog";

import styles from "../styles/official-control-panel.module.css";



type XyInteractionMatrixProps = {

  processCode: SupportProcessAxisCode | null;

  milestoneCode: CoreMilestoneCode | null;

};



/**

 * Matriz visual completa §9. Códigos arquitectónicos fijos; sin estado de ejecución.

 * Columna seleccionada = todas las celdas de esa columna (incl. frontera).

 */

export function XyInteractionMatrix({

  processCode,

  milestoneCode,

}: XyInteractionMatrixProps) {

  const rows = [...XY_SUPPORT_MATRIX_ROWS, XY_CLIENT_BORDER_ROW];



  return (

    <section

      className={styles.xyMatrixSection}

      role="region"

      aria-labelledby="xy-matrix-heading"

      data-xy-matrix="true"

      data-selected-process={processCode ?? ""}

      data-selected-milestone={milestoneCode ?? ""}

    >

      <h3 className={styles.supportProcessSummaryTitle} id="xy-matrix-heading">

        Matriz de interacción X/Y

      </h3>

      <p className={styles.xyMatrixNote} role="note">

        Relación arquitectónica definida. No indica ejecución ni logro del caso.

      </p>



      <div className={styles.xyMatrixScroll}>

        <table className={styles.xyMatrixTable}>

          <thead>

            <tr>

              <th scope="col">Proceso / Hito</th>

              {XY_MATRIX_MILESTONE_COLUMNS.map((code) => (

                <th

                  key={code}

                  scope="col"

                  className={

                    milestoneCode === code

                      ? styles.xyMatrixColSelected

                      : undefined

                  }

                  {...(milestoneCode === code

                    ? { "data-selected-column": "true" }

                    : {})}

                >

                  {code}

                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {rows.map((row) => {

              const rowSelected =

                row.kind === "support" && processCode === row.code;

              return (

                <tr

                  key={row.code}

                  className={[

                    row.kind === "client_border" ? styles.xyMatrixBorderRow : "",

                    rowSelected ? styles.xyMatrixRowSelected : "",

                  ]

                    .filter(Boolean)

                    .join(" ")}

                  {...(rowSelected ? { "data-selected-row": "true" } : {})}

                >

                  <th scope="row">

                    <span className={styles.xyMatrixRowLabel}>{row.label}</span>

                    {row.kind === "client_border" ? (

                      <span className={styles.xyMatrixBorderBadge}>

                        Referencia externa al Eje X

                      </span>

                    ) : null}

                  </th>

                  {XY_MATRIX_MILESTONE_COLUMNS.map((col) => {

                    const relation = getXyRelationCode(row.code, col) ?? "-";

                    const columnSelected = milestoneCode === col;

                    const cellSelected = rowSelected && columnSelected;

                    return (

                      <td

                        key={`${row.code}-${col}`}

                        className={[

                          columnSelected ? styles.xyMatrixColSelected : "",

                          cellSelected ? styles.xyMatrixCellSelected : "",

                        ]

                          .filter(Boolean)

                          .join(" ")}

                        data-relation={relation}

                        {...(columnSelected

                          ? { "data-selected-column": "true" }

                          : {})}

                        {...(cellSelected

                          ? { "data-selected-cell": "true" }

                          : {})}

                        aria-label={`${row.label}, ${col}, ${relation}`}

                      >

                        {relation}

                      </td>

                    );

                  })}

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>



      <ul className={styles.xyMatrixLegend} aria-label="Leyenda de relaciones">

        {XY_RELATION_LEGEND.map((item) => (

          <li key={item.code}>

            <span className={styles.xyRelationBadge} data-relation={item.code}>

              {item.code}

            </span>{" "}

            — {item.label}

          </li>

        ))}

      </ul>

    </section>

  );

}


