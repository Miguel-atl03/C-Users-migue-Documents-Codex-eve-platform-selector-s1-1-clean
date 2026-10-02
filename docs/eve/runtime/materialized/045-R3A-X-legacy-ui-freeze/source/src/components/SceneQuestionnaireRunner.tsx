"use client";

import { LegacySceneQuestionnaireRunner } from "@/components/LegacySceneQuestionnaireRunner";
import {
  RuntimeFullQuestionnaireRunner,
  type RuntimeFullScope,
} from "@/components/RuntimeFullQuestionnaireRunner";
import type { ActivityStructuralScore } from "@/domain/activity";
import type { QuestionnaireAnswer } from "@/domain/questionnaire";

type SceneQuestionnaireItem = {
  sceneId: string;
  sceneName: string;
  depthLevel: string;
  activity: ActivityStructuralScore;
};

type Props = {
  disabled?: boolean;
  scenes: SceneQuestionnaireItem[];
  sessionId: string;
  onComplete: () => void;
  onSceneAnswers: (scene: SceneQuestionnaireItem, answers: QuestionnaireAnswer[]) => Promise<void>;
  runtimeFull?: RuntimeFullScope | null;
};

/**
 * Facade: Runtime FULL never executes legacy catalog sequencing.
 * runtime_full_legacy_sequence_code_executed = false when runtimeFull.enabled.
 */
export function SceneQuestionnaireRunner(props: Props) {
  if (props.runtimeFull?.enabled === true) {
    return (
      <RuntimeFullQuestionnaireRunner
        disabled={props.disabled}
        onComplete={props.onComplete}
        runtimeFull={props.runtimeFull}
        scenes={props.scenes}
        sessionId={props.sessionId}
      />
    );
  }

  return (
    <LegacySceneQuestionnaireRunner
      disabled={props.disabled}
      onComplete={props.onComplete}
      onSceneAnswers={props.onSceneAnswers}
      scenes={props.scenes}
      sessionId={props.sessionId}
    />
  );
}

export type { RuntimeFullScope };
