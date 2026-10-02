#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { WorkMapData } from "../../../../src/domain/local-work-map.ts";
import { buildActivitySelectionStageFromWorkMap } from "../../../../src/services/eve/official-control-panel/official-control-panel-activity-selection-mutation.ts";

import {
  assertLocal,
  createAdminClient,
  resolveEnv,
} from "./r4-seed-lib.mjs";

type Input = {
  actorUserId: string;
  caseId: string;
  participantId: string;
  profileId: string;
  roleRuntimeSessionId: string;
  snapshotVersion: number;
  fixturePath: string;
  sourceReference: string;
};

async function main() {
  const encoded = process.argv[2];
  if (!encoded) throw new Error("activity_selection_snapshot_input_required");
  const input = JSON.parse(
    Buffer.from(encoded, "base64url").toString("utf8"),
  ) as Input;
  const env = resolveEnv();
  assertLocal(env.supabaseUrl);

  const workMap = JSON.parse(
    readFileSync(resolve(input.fixturePath), "utf8"),
  ) as WorkMapData;
  const projection = buildActivitySelectionStageFromWorkMap(
    workMap,
    input.sourceReference,
  );
  const admin = createAdminClient(env);
  const { data, error } = await admin.rpc(
    "eve_admin_prepare_activity_selection_snapshot",
    {
      p_actor_user_id: input.actorUserId,
      p_case_id: input.caseId,
      p_participant_id: input.participantId,
      p_profile_id: input.profileId,
      p_role_runtime_session_id: input.roleRuntimeSessionId,
      p_snapshot_version: input.snapshotVersion,
      p_source_reference: input.sourceReference,
      p_workmap_json: workMap,
      p_policy_projection: projection,
    },
  );
  if (error) throw new Error(error.message);

  process.stdout.write(
    JSON.stringify({
      snapshot: data,
      selectedActivityIds: projection.selectedActivityIds,
      selectionMode: projection.mode,
      eligibleCount: projection.result.eligible_count,
      selectedCount: projection.result.selected_count,
      nonPrimaryContextCount: projection.result.non_primary_context_count,
    }),
  );
}

main().catch((error) => {
  process.stderr.write(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exitCode = 1;
});
