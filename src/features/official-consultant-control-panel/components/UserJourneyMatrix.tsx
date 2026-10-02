"use client";

import styles from "../styles/official-control-panel.module.css";
import type { ExperienceUserJourneyView } from "@/services/eve/official-control-panel/official-control-panel-experience.types";
import { EXPERIENCE_STATUS_LABELS } from "../presentation/experience-governance-presentation";

type UserJourneyMatrixProps = {
  users: ExperienceUserJourneyView[];
  emptyMessage: string;
};

export function UserJourneyMatrix({
  users,
  emptyMessage,
}: UserJourneyMatrixProps) {
  if (users.length === 0) {
    return (
      <p
        className={styles.workspaceEmptyMessage}
        role="status"
        data-testid="experience-journey-empty"
      >
        {emptyMessage}
      </p>
    );
  }

  const screens = users[0]?.cells ?? [];

  return (
    <div
      className={styles.experienceMatrixWrap}
      data-testid="user-journey-matrix"
    >
      <table className={styles.experienceMatrix}>
        <thead>
          <tr>
            <th scope="col">Usuario</th>
            {screens.map((cell) => (
              <th key={cell.screenKey} scope="col" title={cell.screenLabel}>
                {cell.screenLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.userId}
              data-testid={`experience-user-row-${user.userId}`}
            >
              <th scope="row">{user.displayLabel}</th>
              {user.cells.map((cell) => (
                <td
                  key={cell.screenKey}
                  data-status={cell.status}
                  data-testid={`experience-cell-${user.userId}-${cell.screenKey}`}
                >
                  {EXPERIENCE_STATUS_LABELS[cell.status]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
