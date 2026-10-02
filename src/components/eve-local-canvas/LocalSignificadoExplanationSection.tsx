"use client";

import { SheetMotion } from "@/components/eve-worksheet/SheetMotion";
import styles from "./local-canvas.module.css";

export const SIGNIFICADO_EXPLANATION_POINTS = [
  {
    number: "01",
    title: "El objeto es la actividad",
    copy: "No estudiamos el mapa entero de un golpe. Cada actividad seleccionada se vuelve el foco: la miramos de cerca, como una pieza concreta de tu trabajo.",
  },
  {
    number: "02",
    title: "Pocas, a fondo",
    copy: "Como máximo se eligen ocho para estudiarlas con detalle; las demás del mapa se quedan como contexto de fondo, sin pedirte el mismo recorrido.",
  },
  {
    number: "03",
    title: "Una detrás de otra",
    copy: "Lo que sigue abre la primera actividad seleccionada y la recorre en bloques de estudio enfocado: primero confirmar que así ocurre; luego el detalle de qué haces y qué queda listo; después cómo entra en tu día a día (frecuencia, contexto, inicio y cierre); y, si hace falta, una precisión corta. Cuando ese estudio termina, pasamos a la siguiente actividad seleccionada.",
  },
] as const;

type Props = {
  initiallyComplete?: boolean;
  onComplete: () => void;
};

/**
 * SIGNIFICADO_EXPLANATION — orientative only.
 * Does not persist B0, advance Runtime, or branch.
 */
export function LocalSignificadoExplanationSection({
  initiallyComplete = false,
  onComplete,
}: Props) {
  return (
    <section
      aria-labelledby="significado-explainer-title"
      className={styles.orientScreen}
      id="significado-orient"
    >
      <div className={styles.orientInner}>
        <SheetMotion stagger>
          <header className={`${styles.orientHeader} ${styles.orientHeaderSolo}`}>
            <div className={styles.orientHeaderCopy}>
              <p className={styles.orientKicker}>Orientación breve</p>
              <h2 className={styles.orientTitle} id="significado-explainer-title">
                Antes de estudiar tus actividades
              </h2>
              <p className={styles.orientLead}>
                En el mapa ya quedó lo que haces. Ahora el foco pasa a actividades
                concretas: cada una seleccionada será el objeto que vamos a entender
                en la práctica.
              </p>
            </div>
          </header>

          <div className={styles.orientStaticList}>
            {SIGNIFICADO_EXPLANATION_POINTS.map((point, index) => (
              <SheetMotion delayMs={60 + index * 70} key={point.number} variant="band">
                <div className={styles.orientStaticRow}>
                  <span className={styles.orientRowNumber}>{point.number}</span>
                  <div className={styles.orientRowMain}>
                    <span className={styles.orientRowTitle}>{point.title}</span>
                    <span className={styles.orientRowCopy}>{point.copy}</span>
                  </div>
                </div>
              </SheetMotion>
            ))}
          </div>

          <footer className={styles.orientFooter}>
            <p className={styles.orientFooterNote}>
              {initiallyComplete
                ? "Orientación ya revisada. Puedes continuar con Significado abajo."
                : "Todo tu mapa sigue ahí. Solo algunas actividades entran al estudio cercano; el resto sostiene el panorama sin pedir el mismo detalle."}
            </p>
            <button
              className={styles.sheetAdvanceQuiet}
              onClick={onComplete}
              type="button"
            >
              Seguir en la hoja ↓
            </button>
          </footer>
        </SheetMotion>
      </div>
    </section>
  );
}
