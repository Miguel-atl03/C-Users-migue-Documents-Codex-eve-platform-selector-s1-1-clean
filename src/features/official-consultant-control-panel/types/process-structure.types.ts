export type ProcessStructureStatus =
  | "idle"
  | "loading"
  | "empty"
  | "partial"
  | "active"
  | "error";

export type {
  ProcessStructureMilestoneView,
  ProcessStructureViewModel,
} from "../presentation/process-structure-presentation";
