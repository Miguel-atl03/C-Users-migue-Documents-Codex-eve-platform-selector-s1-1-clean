"use client";

import styles from "../styles/official-control-panel.module.css";
import type { FunctionalProfileListItem } from "../types/participant-profile.types";
import { FunctionalProfileItem } from "./FunctionalProfileItem";

type FunctionalProfileListProps = {
  participantId: string;
  profiles: FunctionalProfileListItem[];
  loading: boolean;
  error: boolean;
  selectedProfileId: string | null;
  onSelectProfile: (participantId: string, profileId: string | null) => void;
};

export function FunctionalProfileList({
  participantId,
  profiles,
  loading,
  error,
  selectedProfileId,
  onSelectProfile,
}: FunctionalProfileListProps) {
  if (loading) {
    return (
      <p className={styles.participantProfilesStatus} role="status" aria-live="polite">
        Cargando perfiles funcionales…
      </p>
    );
  }

  if (error) {
    return (
      <p className={styles.participantProfilesStatus} role="alert">
        No fue posible abrir la participación solicitada.
      </p>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className={styles.participantProfilesEmpty} role="status">
        <p className={styles.participantProfilesEmptyTitle}>
          Persona participante
        </p>
        <p>
          No hay perfiles funcionales registrados para esta persona.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.profileList} aria-label="Roles funcionales">
      {profiles.map((profile) => (
        <FunctionalProfileItem
          key={profile.id}
          participantId={participantId}
          profile={profile}
          selected={selectedProfileId === profile.id}
          onSelect={onSelectProfile}
        />
      ))}
    </ul>
  );
}
