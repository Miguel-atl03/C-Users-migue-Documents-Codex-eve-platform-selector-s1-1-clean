export type LocalDemoIntroExamplePayload = {
  exampleNarrative: string;
  exampleSource: "deterministic";
  source: "local_demo_synthetic";
  mode: "local_ui_exercise";
  usesSupabase: false;
  usesProduction: false;
  llmConfigured: false;
};

export function buildLocalDemoIntroExamplePayload(
  deterministicFallback: string,
): LocalDemoIntroExamplePayload {
  return {
    exampleNarrative: deterministicFallback.trim(),
    exampleSource: "deterministic",
    source: "local_demo_synthetic",
    mode: "local_ui_exercise",
    usesSupabase: false,
    usesProduction: false,
    llmConfigured: false,
  };
}
