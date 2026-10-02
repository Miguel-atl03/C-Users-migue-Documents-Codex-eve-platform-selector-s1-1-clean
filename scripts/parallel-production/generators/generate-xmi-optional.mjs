export function generateXmiOptional() {
  return {
    generated: false,
    warnings: [
      {
        warning_id: "WARN_XMI_OPTIONAL_001",
        warning_type: "xmi_optional_not_generated",
        severity: "low",
        owner: "parallel_production_design_area",
        affected_artifact_type: "candidate_export_package",
        affected_element_ids: ["XMI_OPTIONAL"],
        reason: "El fixture validado no requiere interoperabilidad XMI y no se emite XMI para evitar degradar semantica MMABP.",
        downstream_effect: "La salida candidata queda limitada a BPMN XML y PlantUML trazados.",
        allowed_uses: ["candidate_diagram_review"],
        prohibited_uses: ["final_export", "capa_2", "capa_2_5", "capa_3"],
        related_gap_ids: [],
        resolution_recommendation: "Agregar contrato XMI especifico cuando exista una necesidad de interoperabilidad UML verificable.",
        traceability_status: "complete",
        semantic_preservation_status: "passed_with_warnings"
      }
    ],
    gaps: []
  };
}
