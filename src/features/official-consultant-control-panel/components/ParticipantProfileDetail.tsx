"use client";

import styles from "../styles/official-control-panel.module.css";
import type {
  CaseParticipantListItem,
  FunctionalProfileListItem,
} from "../types/participant-profile.types";

type ParticipantProfileDetailProps = {
  participant: CaseParticipantListItem | null;
  profile: FunctionalProfileListItem | null;
};

export function ParticipantProfileDetail({
  participant,
  profile,
}: ParticipantProfileDetailProps) {
  if (!participant) return null;

  if (!profile) {
    return (
      <section
        className={styles.participantDetail}
        aria-labelledby="participant-detail-heading"
      >
        <h3
          className={styles.participantDetailTitle}
          id="participant-detail-heading"
        >
          Persona participante
        </h3>
        <dl className={styles.participantDetailList}>
          <div>
            <dt>Persona participante</dt>
            <dd>{participant.label}</dd>
          </div>
          <div>
            <dt>Estado de asignación</dt>
            <dd>{participant.assignmentLabel}</dd>
          </div>
          <div>
            <dt>Puesto declarado</dt>
            <dd>{participant.declaredPosition ?? "Sin declarar"}</dd>
          </div>
          <div>
            <dt>Perfiles funcionales</dt>
            <dd>
              {participant.profileCount === 0
                ? "No hay perfiles funcionales registrados para esta persona."
                : `${participant.profileCount} registrados`}
            </dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <section
      className={styles.participantDetail}
      aria-labelledby="profile-detail-heading"
    >
      <h3 className={styles.participantDetailTitle} id="profile-detail-heading">
        Perfil funcional
      </h3>
      <dl className={styles.participantDetailList}>
        <div>
          <dt>Persona participante</dt>
          <dd>{participant.label}</dd>
        </div>
        <div>
          <dt>Perfiles funcionales</dt>
          <dd>{participant.profileCount}</dd>
        </div>
        <div>
          <dt>Estado de asignación</dt>
          <dd>{participant.assignmentLabel}</dd>
        </div>
        <div>
          <dt>Puesto declarado</dt>
          <dd>{participant.declaredPosition ?? "Sin declarar"}</dd>
        </div>
        <div>
          <dt>Perfil seleccionado</dt>
          <dd>{profile.label}</dd>
        </div>
        <div>
          <dt>Perfil funcional</dt>
          <dd>{profile.label}</dd>
        </div>
        <div>
          <dt>Estado de asignación</dt>
          <dd>{profile.resolutionLabel}</dd>
        </div>
        <div>
          <dt>Cobertura</dt>
          <dd>No disponible</dd>
        </div>
        <div>
          <dt>Responsabilidades</dt>
          <dd>No disponibles</dd>
        </div>
        <div>
          <dt>Actividades</dt>
          <dd>No disponibles</dd>
        </div>
      </dl>
    </section>
  );
}
