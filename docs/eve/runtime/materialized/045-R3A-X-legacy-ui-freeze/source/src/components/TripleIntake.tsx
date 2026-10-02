"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity, RelatoAnswer, RelatoType } from "@/lib/types";

type Props = {
  disabled?: boolean;
  onComplete: (payload: {
    activities: Activity[];
    relatos: Record<RelatoType, RelatoAnswer[]>;
  }) => void | Promise<void>;
};

const draftStorageKey = "eve:capa1:activity-draft:v1";

function readStoredDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedDraft = window.localStorage.getItem(draftStorageKey);

  if (!savedDraft) return null;

  try {
    const parsedDraft = JSON.parse(savedDraft) as {
      activities?: unknown;
    };

    if (
      Array.isArray(parsedDraft.activities) &&
      parsedDraft.activities.some(
        (activity) => typeof activity === "string" && activity.trim(),
      )
    ) {
      return parsedDraft.activities.map((activity) =>
        typeof activity === "string" ? activity : "",
      );
    }
  } catch {
    window.localStorage.removeItem(draftStorageKey);
  }

  return null;
}

const formalExamples = [
  "Coordinar entregas con operaciones verificando disponibilidad de inventario, fechas comprometidas y prioridades de clientes.",
  "Validar solicitudes de credito revisando historial de pago, limites autorizados y condiciones comerciales antes de liberar pedidos.",
  "Supervisar el avance diario del equipo comercial dando seguimiento a metas, pendientes criticos y necesidades de soporte operativo.",
  "Dar seguimiento a ordenes de compra asegurando que proveedores entreguen materiales completos y en tiempo.",
  "Coordinar mantenimientos correctivos con produccion para reducir paros y asegurar continuidad operativa.",
  "Revisar cierres contables verificando diferencias, movimientos pendientes y documentacion de respaldo.",
];

const actionVerbs = [
  "registrar",
  "procesar",
  "empacar",
  "escanear",
  "clasificar",
  "inspeccionar",
  "capturar",
  "etiquetar",
  "despachar",
  "cargar",
  "archivar",
  "preparar",
  "realizar",
  "elaborar",
  "validar",
  "revisar",
  "enviar",
  "publicar",
  "liberar",
  "coordinar",
  "supervisar",
  "gestionar",
  "programar",
  "monitorear",
  "dar seguimiento",
  "seguimiento",
  "controlar",
  "optimizar",
  "resolver",
  "asignar",
  "negociar",
  "integrar",
  "definir",
  "evaluar",
  "disenar",
  "establecer",
  "transformar",
  "alinear",
  "decidir",
  "identificar",
  "planificar",
  "reestructurar",
  "impulsar",
  "desarrollar",
];

const contextSignals = [
  "con",
  "para",
  "por",
  "a",
  "al",
  "del",
  "revisando",
  "verificando",
  "asegurando",
  "dando",
  "antes",
  "durante",
  "mediante",
  "cuando",
  "entre",
  "autorizadas",
  "autorizados",
  "propuestas",
  "proyecto",
  "proyectos",
  "clientes",
  "proveedores",
  "equipo",
  "operaciones",
  "produccion",
  "finanzas",
];

const helpCategories = [
  {
    title: "Actividades Operativas",
    description: "Actividades repetitivas o de ejecucion directa.",
    verbs:
      "Registrar, Procesar, Empacar, Escanear, Clasificar, Inspeccionar, Capturar, Etiquetar, Despachar, Cargar, Archivar, Preparar",
  },
  {
    title: "Actividades Tacticas",
    description: "Actividades de coordinacion, seguimiento o control.",
    verbs:
      "Coordinar, Supervisar, Gestionar, Programar, Monitorear, Controlar, Optimizar, Resolver, Asignar, Negociar, Dar seguimiento, Integrar",
  },
  {
    title: "Actividades Estrategicas",
    description: "Actividades de decision, planeacion o direccion.",
    verbs:
      "Definir, Evaluar, Disenar, Establecer, Transformar, Alinear, Decidir, Identificar, Planificar, Reestructurar, Impulsar, Desarrollar",
  },
];

export function TripleIntake({ disabled = false, onComplete }: Props) {
  const [formalActivities, setFormalActivities] = useState(
    () => readStoredDraft() ?? ["", "", ""],
  );
  const [draftRestored, setDraftRestored] = useState(
    () => readStoredDraft() !== null,
  );
  const [exampleIndex, setExampleIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [formalTouched, setFormalTouched] = useState<Record<number, boolean>>(
    {},
  );

  const selectedActivities = formalActivities
    .map((activity) => activity.trim())
    .filter(Boolean);

  const formalValidation = useMemo(
    () => formalActivities.map((activity) => validateActivity(activity)),
    [formalActivities],
  );

  const canContinueFormal =
    selectedActivities.length > 0 &&
    formalActivities.every(
      (activity, index) => !activity.trim() || formalValidation[index].valid,
    );

  useEffect(() => {
    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        activities: formalActivities,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [formalActivities]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!formalActivities.some((activity) => activity.trim())) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);

    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [formalActivities]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setExampleIndex((current) => (current + 1) % formalExamples.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const updateFormal = (index: number, value: string) => {
    setFormalActivities((current) =>
      current.map((activity, currentIndex) =>
        currentIndex === index ? value : activity,
      ),
    );
    setFormalTouched((current) => ({ ...current, [index]: true }));
  };

  const removeFormal = (index: number) => {
    setFormalActivities((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setFormalTouched((current) =>
      Object.fromEntries(
        Object.entries(current)
          .filter(([key]) => Number(key) !== index)
          .map(([key, value]) => {
            const numericKey = Number(key);
            return [numericKey > index ? numericKey - 1 : numericKey, value];
          }),
      ),
    );
  };

  const finish = () => {
    const timestamp = Date.now();
    const userActivities = selectedActivities.map((title, index) => ({
      id: `formal-${timestamp}-${index}`,
      title,
      narrativeAnchor: title,
      origin: "usuario_redactada" as const,
      accepted: true,
      critical: false,
      interconnectionScore: Math.max(1, 5 - index),
    }));

    onComplete({
      activities: userActivities,
      relatos: {
        ultimo_incendio: [],
        lo_que_no_deberia_pasar: [],
      },
    });
    window.localStorage.removeItem(draftStorageKey);
    setDraftRestored(false);
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Registro inicial
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">
          Actividades reales de tu trabajo
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
          Primero registraremos lo que haces en la practica. Despues la
          plataforma usara dos relatos breves para detectar dependencias,
          excepciones y actividades que ayudan a explicar mejor tu trabajo.
        </p>
        <div className="mt-8 grid gap-2 text-sm">
          {[
            "1. Redactar actividades",
            "2. Seleccion automatica",
            "3. Preguntas guiadas",
          ].map((item, index) => (
            <div
              className={[
                "rounded-md border px-3 py-2",
                index === 0
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                  : "border-neutral-200 bg-white text-neutral-500",
              ].join(" ")}
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
        {
          <div>
            {draftRestored && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                Recuperamos el borrador de actividades guardado en este
                navegador.
              </div>
            )}
            <p className="text-sm font-semibold text-neutral-950">
              Redacta las actividades que realizas para llevar a cabo tu trabajo
            </p>
            <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Ejemplos de como redactar una actividad
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Describe actividades reales de tu trabajo usando acciones
                concretas y el contexto necesario para entender como se
                realizan.
              </p>
              <div
                className="mt-4 min-h-20 rounded-md border border-neutral-200 bg-white p-4 text-sm leading-6 text-neutral-600 transition-opacity duration-500"
                key={formalExamples[exampleIndex]}
              >
                {formalExamples[exampleIndex]}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {formalActivities.map((activity, index) => (
                <div className="block" key={index}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-700">
                      Actividad {index + 1}
                    </span>
                    {formalActivities.length > 1 && (
                      <button
                        className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-red-300 hover:text-red-700"
                        onClick={() => removeFormal(index)}
                        type="button"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <textarea
                    aria-label={`Actividad ${index + 1}`}
                    className={[
                      "mt-2 min-h-24 w-full resize-y rounded-md border px-3 py-3 text-sm leading-6 outline-none focus:ring-2",
                      formalTouched[index] && !formalValidation[index].valid
                        ? "border-amber-300 focus:border-amber-500 focus:ring-amber-100"
                        : "border-neutral-300 focus:border-emerald-600 focus:ring-emerald-100",
                    ].join(" ")}
                    onChange={(event) => updateFormal(index, event.target.value)}
                    placeholder=""
                    value={activity}
                  />
                  {formalTouched[index] && !formalValidation[index].valid && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <p className="font-semibold">
                        Revisa esta actividad antes de continuar:
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {formalValidation[index].messages.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                      <div className="mt-3 rounded-md bg-white px-3 py-2 text-amber-950">
                        <p className="font-semibold">
                          Para completarla, puedes agregar:
                        </p>
                        <p className="mt-1 leading-6">
                          que revisas, con quien lo coordinas, que criterio usas,
                          que entregable produces, en que sistema o medio lo
                          registras, y para que decision o resultado sirve.
                        </p>
                        <p className="mt-2 text-xs leading-5 text-amber-800">
                          Estructura sugerida: verbo + objeto de trabajo + con
                          quien o con que informacion + resultado esperado.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-neutral-200">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-900"
                onClick={() => setHelpOpen((current) => !current)}
                type="button"
              >
                <span>No sabes como empezar?</span>
                <span className="text-neutral-500">{helpOpen ? "-" : "+"}</span>
              </button>
              {helpOpen && (
                <div className="border-t border-neutral-200 p-4">
                  <p className="text-sm font-semibold text-neutral-950">
                    Usa verbos de accion en infinitivo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    Piensa en actividades reales que realizas diariamente,
                    semanalmente o para sacar adelante una responsabilidad
                    importante.
                  </p>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {helpCategories.map((category) => (
                      <div
                        className="rounded-md bg-neutral-50 p-3"
                        key={category.title}
                      >
                        <p className="text-sm font-semibold text-neutral-950">
                          {category.title}
                        </p>
                        <p className="mt-2 text-sm text-neutral-600">
                          {category.description}
                        </p>
                        <p className="mt-3 text-xs leading-5 text-neutral-500">
                          Verbos posibles a utilizar:{" "}
                          {category.verbs}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium"
                onClick={() => setFormalActivities((current) => [...current, ""])}
                type="button"
              >
                Agregar actividad
              </button>
              <button
                className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
                disabled={!canContinueFormal}
                onClick={() => {
                  setFormalTouched(
                    Object.fromEntries(
                      formalActivities.map((_, index) => [index, true]),
                    ),
                  );
                  if (canContinueFormal) {
                    finish();
                  }
                }}
                type="button"
              >
                {disabled ? "Guardando..." : "Continuar"}
              </button>
            </div>
          </div>
        }
      </div>
    </section>
  );
}

function validateActivity(activity: string) {
  const text = activity.trim();

  if (!text) {
    return {
      valid: true,
      messages: [],
    };
  }

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);
  const hasActionVerb = actionVerbs.some((verb) =>
    normalized.includes(verb.toLowerCase()),
  );
  const startsWithInfinitive = /\b[a-z]{4,}(ar|er|ir)\b/.test(
    words[0] ?? "",
  );
  const hasContextSignal = contextSignals.some((signal) =>
    normalized.split(/\s+/).includes(signal.toLowerCase()),
  );
  const messages: string[] = [];

  if (words.length <= 15) {
    messages.push(
      `Necesita mas de 15 palabras. Ahora tiene ${words.length}.`,
    );
  }

  if (!hasActionVerb && !startsWithInfinitive) {
    messages.push(
      "Incluye un verbo de accion en infinitivo, por ejemplo: elaborar, validar, coordinar, revisar, registrar o dar seguimiento.",
    );
  }

  if (!hasContextSignal) {
    messages.push(
      "Agrega contexto usando palabras como: para, con, mediante, cuando, antes, durante, clientes, proveedores, equipo o area responsable.",
    );
  }

  if (messages.length) {
    return {
      valid: false,
      messages,
    };
  }

  return {
    valid: true,
    messages: [],
  };
}
