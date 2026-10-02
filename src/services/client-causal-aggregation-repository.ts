import type {
  ClientCausalAggregationOutput,
  ClientSessionCausalInput,
} from "@/domain/client-causal";
import { supabaseServer } from "@/lib/supabase-server";

type SessionCausalOutputRow = {
  id: string;
  sesion_id: string;
  output_json: ClientSessionCausalInput["output"];
  generated_at: string;
};

type UserRow = {
  id: string;
  empresa_id: string;
  rol_declarado: string | null;
};

type SessionRow = {
  id: string;
  usuario_id: string;
};

type PersistClientAggregationResult = {
  persisted: boolean;
  aggregation_run_id: string | null;
  client_causal_output_id: string | null;
  node_aggregation_count: number;
  contradiction_count: number;
};

const latestBySession = (rows: SessionCausalOutputRow[]) => {
  const bySession = new Map<string, SessionCausalOutputRow>();

  for (const row of rows) {
    const current = bySession.get(row.sesion_id);
    if (!current || row.generated_at > current.generated_at) {
      bySession.set(row.sesion_id, row);
    }
  }

  return [...bySession.values()];
};

const buildInputsFromRows = ({
  empresaId,
  sessionRows,
  userRows,
  outputRows,
}: {
  empresaId: string;
  sessionRows: SessionRow[];
  userRows: UserRow[];
  outputRows: SessionCausalOutputRow[];
}): ClientSessionCausalInput[] => {
  const userById = new Map(userRows.map((user) => [user.id, user]));
  const sessionById = new Map(sessionRows.map((session) => [session.id, session]));

  return latestBySession(outputRows).map((row) => {
    const session = sessionById.get(row.sesion_id);
    const user = session ? userById.get(session.usuario_id) : null;
    const roleLabel = user?.rol_declarado ?? null;
    const usuarioId = session?.usuario_id ?? null;

    return {
      empresa_id: empresaId,
      sesion_id: row.sesion_id,
      usuario_id: usuarioId,
      role_label: roleLabel,
      role_observation_position: {
        sesion_id: row.sesion_id,
        usuario_id: usuarioId,
        role_label: roleLabel,
        observation_scope: "partial_role_lens_on_client_system",
        interpretation_unit: "client_system",
        note:
          "Salida Capa 2 seleccionada como lente causal parcial mas reciente para esta sesion de rol.",
      },
      session_causal_output_id: row.id,
      output: row.output_json,
    };
  });
};

export async function loadClientSessionCausalInputs({
  empresaId,
  sessionIds,
}: {
  empresaId: string;
  sessionIds?: string[];
}): Promise<ClientSessionCausalInput[]> {
  const { data: users, error: usersError } = await supabaseServer
    .from("usuarios")
    .select("id, empresa_id, rol_declarado")
    .eq("empresa_id", empresaId);

  if (usersError) {
    throw new Error(`Unable to load client users: ${usersError.message}`);
  }

  const userRows = (users ?? []) as UserRow[];
  const userIds = userRows.map((user) => user.id);
  if (userIds.length === 0) return [];

  let sessionQuery = supabaseServer
    .from("sesiones_llenado")
    .select("id, usuario_id")
    .in("usuario_id", userIds);

  if (sessionIds && sessionIds.length > 0) {
    sessionQuery = sessionQuery.in("id", sessionIds);
  }

  const { data: sessions, error: sessionsError } = await sessionQuery;
  if (sessionsError) {
    throw new Error(`Unable to load client sessions: ${sessionsError.message}`);
  }

  const sessionRows = (sessions ?? []) as SessionRow[];
  const resolvedSessionIds = sessionRows.map((session) => session.id);
  if (resolvedSessionIds.length === 0) return [];

  const { data: outputs, error: outputsError } = await supabaseServer
    .from("session_causal_outputs")
    .select("id, sesion_id, output_json, generated_at")
    .in("sesion_id", resolvedSessionIds)
    .order("generated_at", { ascending: false });

  if (outputsError) {
    throw new Error(
      `Unable to load session causal outputs: ${outputsError.message}`,
    );
  }

  return buildInputsFromRows({
    empresaId,
    sessionRows,
    userRows,
    outputRows: (outputs ?? []) as SessionCausalOutputRow[],
  });
}

export async function loadClientSessionCausalInputsBySessionIds({
  sessionIds,
}: {
  sessionIds: string[];
}): Promise<ClientSessionCausalInput[]> {
  if (sessionIds.length === 0) return [];

  const { data: sessions, error: sessionsError } = await supabaseServer
    .from("sesiones_llenado")
    .select("id, usuario_id")
    .in("id", sessionIds);

  if (sessionsError) {
    throw new Error(`Unable to load selected sessions: ${sessionsError.message}`);
  }

  const sessionRows = (sessions ?? []) as SessionRow[];
  const userIds = sessionRows.map((session) => session.usuario_id);
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabaseServer
    .from("usuarios")
    .select("id, empresa_id, rol_declarado")
    .in("id", userIds);

  if (usersError) {
    throw new Error(`Unable to load selected session users: ${usersError.message}`);
  }

  const userRows = (users ?? []) as UserRow[];
  const empresaIds = [...new Set(userRows.map((user) => user.empresa_id))];
  if (empresaIds.length !== 1) {
    throw new Error(
      `Selected sessionIds must belong to exactly one empresa for Capa 2.5. Detected empresaIds: ${empresaIds.join(", ")}.`,
    );
  }

  const { data: outputs, error: outputsError } = await supabaseServer
    .from("session_causal_outputs")
    .select("id, sesion_id, output_json, generated_at")
    .in("sesion_id", sessionRows.map((session) => session.id))
    .order("generated_at", { ascending: false });

  if (outputsError) {
    throw new Error(
      `Unable to load selected session causal outputs: ${outputsError.message}`,
    );
  }

  return buildInputsFromRows({
    empresaId: empresaIds[0],
    sessionRows,
    userRows,
    outputRows: (outputs ?? []) as SessionCausalOutputRow[],
  });
}

export async function persistClientCausalAggregationOutput({
  output,
}: {
  output: ClientCausalAggregationOutput;
}): Promise<PersistClientAggregationResult> {
  const runStatus =
    output.needs_reentry_client || output.needs_expert_review_client
      ? "completed_with_flags"
      : "completed";

  const { data: run, error: runError } = await supabaseServer
    .from("client_causal_aggregation_runs")
    .insert({
      empresa_id: output.empresa_id,
      aggregation_schema_version: output.schema_version,
      causal_engine_version: "CAPA2_5_CLIENT_MVP_V1",
      source_session_causal_output_ids: output.source.session_causal_output_ids,
      source_sesion_ids: output.source.sesion_ids,
      session_count: output.source.sesion_ids.length,
      run_status: runStatus,
      generated_at: output.generated_at,
    })
    .select("id")
    .single();

  if (runError) {
    throw new Error(`Unable to persist client aggregation run: ${runError.message}`);
  }

  const aggregationRunId = (run as { id: string }).id;
  const { data: clientOutput, error: outputError } = await supabaseServer
    .from("client_causal_outputs")
    .insert({
      aggregation_run_id: aggregationRunId,
      empresa_id: output.empresa_id,
      output_json: output,
      client_root_node_probable: output.client_root_node_probable?.node_id ?? null,
      confidence_level_client: output.confidence_level_client,
      needs_reentry_client: output.needs_reentry_client,
      needs_expert_review_client: output.needs_expert_review_client,
      preliminary_client_narrative: output.preliminary_client_narrative.text,
      generated_at: output.generated_at,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (outputError) {
    throw new Error(`Unable to persist client causal output: ${outputError.message}`);
  }

  const nodeRows = [
    ...output.cross_session_nodes_recurrent,
    ...output.cross_session_nodes_local,
    ...output.cross_session_nodes_dominant_transversal,
    ...output.cross_session_nodes_recursive,
    ...output.cross_session_nodes_symptom_transversal,
  ].map((node) => ({
    aggregation_run_id: aggregationRunId,
    empresa_id: output.empresa_id,
    node_code_canonical: node.node_id,
    node_name_canonical: node.node_label,
    aggregation_kind: node.aggregation_kind,
    session_count_supporting: node.session_count_supporting,
    session_count_weakening: node.session_count_weakening,
    session_coverage_ratio: node.session_coverage_ratio,
    weighted_support_score: node.weighted_support_score,
    weighted_weaken_score: node.weighted_weaken_score,
    average_confidence_score: node.average_confidence_score,
    confidence_level: node.confidence_level,
    dominant_session_ids: node.dominant_session_ids,
    local_session_ids: node.local_session_ids,
    evidence_bundle_ids: node.evidence_bundle_ids,
    aggregation_json: node,
  }));

  if (nodeRows.length > 0) {
    const { error: nodeError } = await supabaseServer
      .from("client_node_aggregation")
      .insert(nodeRows);

    if (nodeError) {
      throw new Error(`Unable to persist client node aggregation: ${nodeError.message}`);
    }
  }

  const contradictionRows = output.cross_session_contradictions.map((item) => ({
    aggregation_run_id: aggregationRunId,
    empresa_id: output.empresa_id,
    contradiction_type: item.contradiction_type,
    node_codes: item.node_ids,
    supporting_session_ids: item.supporting_session_ids,
    weakening_session_ids: item.weakening_session_ids,
    severity: item.severity,
    requires_expert_review: item.requires_expert_review,
    contradiction_json: item,
  }));

  if (contradictionRows.length > 0) {
    const { error: contradictionError } = await supabaseServer
      .from("client_contradiction_map")
      .insert(contradictionRows);

    if (contradictionError) {
      throw new Error(
        `Unable to persist client contradiction map: ${contradictionError.message}`,
      );
    }
  }

  return {
    persisted: true,
    aggregation_run_id: aggregationRunId,
    client_causal_output_id: (clientOutput as { id: string }).id,
    node_aggregation_count: nodeRows.length,
    contradiction_count: contradictionRows.length,
  };
}
