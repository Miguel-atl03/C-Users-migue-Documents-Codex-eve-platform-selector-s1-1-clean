export {
  LOCAL_CANVAS_SECTION_ORDER,
  isRuntimeGovernedSection,
  type LocalCanvasSectionDescriptor,
  type LocalCanvasSectionId,
  type LocalCanvasSectionStatus,
  type LocalCanvasUnlockSource,
} from "./section-model";

export {
  LocalCanvasExperience,
  scrollToLocalCanvasSection,
} from "./LocalCanvasExperience";
export type {
  LocalCanvasFrontDoorMode,
  LocalCanvasWorkMapProps,
  LocalCanvasSignificadoProps,
  LocalCanvasB05Props,
  LocalCanvasB1Props,
  LocalCanvasB2Props,
  LocalCanvasB3Props,
  LocalCanvasB4Props,
  LocalCanvasB5Props,
} from "./LocalCanvasExperience";
export { LocalLoginSection } from "./LocalLoginSection";
export { LocalEstadoASection } from "./LocalEstadoASection";
export { LocalSessionResumeSection } from "./LocalSessionResumeSection";
export { LocalWorkMapExplanationSection } from "./LocalWorkMapExplanationSection";
export { LocalWorkMapSection } from "./LocalWorkMapSection";
export type { LocalWorkMapSectionProps } from "./LocalWorkMapSection";
export { LocalCanvasWorkMapBuilder } from "./LocalCanvasWorkMapBuilder";
export type { LocalCanvasWorkMapBuilderProps } from "./LocalCanvasWorkMapBuilder";
export { LocalSignificadoExplanationSection } from "./LocalSignificadoExplanationSection";
export { buildSceneEntryViewModel } from "./build-scene-entry-view-model";
export { LocalSceneEntrySection } from "./LocalSceneEntrySection";
export type {
  LocalSceneEntrySectionProps,
  SceneEntryPhase,
} from "./LocalSceneEntrySection";
export {
  createSceneEntryVisualStubViewModel,
  createSceneEntryVisualCandidateViewModel,
} from "./scene-entry-visual-stub";
export type {
  SceneEntryViewModel,
  SceneEntryJourneyMode,
  SceneEntryPresentationContract,
} from "./scene-entry-presentation-contract";
export { LocalEstadoAPositionCuadrantesSection } from "./LocalEstadoAPositionCuadrantesSection";
export {
  LocalEstadoAHeroGateSection,
  LOCAL_HERO_GATE_STORAGE_KEY,
  readLocalHeroGateSeen,
  writeLocalHeroGateSeen,
} from "./LocalEstadoAHeroGateSection";
export type { LocalEstadoAHeroGateSectionProps } from "./LocalEstadoAHeroGateSection";
export { LocalB0MemoriaOperativaSection } from "./LocalB0MemoriaOperativaSection";
export type {
  LocalB0MemoriaOperativaSectionProps,
  B0MemoriaPart,
} from "./LocalB0MemoriaOperativaSection";
export { LocalB0ComoOcurreSection } from "./LocalB0ComoOcurreSection";
export type {
  LocalB0ComoOcurreSectionProps,
  B0ComoOcurreConfirmPayload,
  B0ComoOcurreDimensionValues,
  B0BoundariesConfirmPayload,
} from "./LocalB0ComoOcurreSection";
export {
  B0_Q06,
  B0_Q07,
  B0_QB,
} from "./b0-madre-copy";
export { LocalBlockShellChrome } from "./LocalBlockShellChrome";
export type { LocalBlockShellChromeProps } from "./LocalBlockShellChrome";
export { LocalB0FrecuenciaSection } from "./LocalB0FrecuenciaSection";
export type {
  LocalB0FrecuenciaSectionProps,
  B0FrecuenciaConfirmPayload,
  B0FrequencyOption,
  B0ContextOption,
  B0ActorOption,
} from "./LocalB0FrecuenciaSection";
export {
  FREQUENCY_OPTIONS,
  CONTEXT_OPTIONS,
  ACTOR_OPTIONS,
} from "./LocalB0FrecuenciaSection";
export { LocalSignificadoSection } from "./LocalSignificadoSection";
export type { LocalSignificadoSectionProps } from "./LocalSignificadoSection";
/** @deprecated Not mounted on local continuous sheet — kept for e2e-block0 / legacy. */
export { LocalCanvasSignificadoBuilder } from "./LocalCanvasSignificadoBuilder";
/** @deprecated Not mounted on local continuous sheet — kept for e2e-block0 / legacy. */
export type { LocalCanvasSignificadoBuilderProps } from "./LocalCanvasSignificadoBuilder";
export { LocalCanvasB05Section } from "./LocalCanvasB05Section";
export type { LocalCanvasB05SectionProps } from "./LocalCanvasB05Section";
export {
  createB05VisualStubViewModel,
  createB05VisualCandidateViewModel,
  createB05ClarificationFixtureViewModel,
  createB05CausalPreviewViewModel,
  B05_BASE_SOURCE_CODES,
} from "./b05-visual-stub";
export {
  b05AnswerToHumanValue,
  b05AnswerToRuntimeValue,
  isB05RuntimePresentation,
  mapRuntimePresentationToB05,
} from "./b05-runtime-binding";
export type {
  B05PresentationViewModel,
  B05SlotAnswer,
  B05SlotPresentation,
  B05ControlFamily,
  B05PresentationSurface,
} from "./b05-presentation-contract";
export { LocalCanvasB1InstrumentSection } from "./LocalCanvasB1InstrumentSection";
export type { LocalCanvasB1InstrumentSectionProps } from "./LocalCanvasB1InstrumentSection";
/** @deprecated Prefer `LocalCanvasB1InstrumentSection`. Archived shell only. */
export { LocalCanvasB1Section } from "./LocalCanvasB1Section";
/** @deprecated Prefer `LocalCanvasB1InstrumentSection`. Archived shell only. */
export type { LocalCanvasB1SectionProps } from "./LocalCanvasB1Section";
export {
  createB1VisualStubViewModel,
  createB1VisualCandidateViewModel,
  createB1ExceptionFixtureViewModel,
  createB1ClarificationFixtureViewModel,
  B1_BASE_SOURCE_CODES,
} from "./b1-visual-stub";
export type {
  B1PresentationViewModel,
  B1SlotAnswer,
  B1SlotPresentation,
  B1ControlFamily,
  B1PresentationSurface,
} from "./b1-presentation-contract";
export { LocalCanvasB2InstrumentSection } from "./LocalCanvasB2InstrumentSection";
export type { LocalCanvasB2InstrumentSectionProps } from "./LocalCanvasB2InstrumentSection";
export { LocalCanvasB2PiezaSection } from "./LocalCanvasB2PiezaSection";
export type {
  LocalCanvasB2PiezaSectionProps,
  LocalCanvasB2PiezaBlockMark,
} from "./LocalCanvasB2PiezaSection";
export {
  createB2VisualStubViewModel,
  createB2VisualCandidateViewModel,
  createB2ObjetoPathFixtureViewModel,
  createB2RelationsFixtureViewModel,
  createB2ExceptionFixtureViewModel,
  createB2ClarificationFixtureViewModel,
  createB2SubjectPathFixtureViewModel,
  createB2ActionPathFixtureViewModel,
  createB2CausalFixtureViewModel,
  B2_BASE_SOURCE_CODES,
} from "./b2-visual-stub";
export type {
  B2PresentationViewModel,
  B2SlotAnswer,
  B2SlotPresentation,
  B2ControlFamily,
  B2PresentationSurface,
} from "./b2-presentation-contract";
export { LocalCanvasB3InstrumentSection } from "./LocalCanvasB3InstrumentSection";
export type { LocalCanvasB3InstrumentSectionProps } from "./LocalCanvasB3InstrumentSection";
export {
  createB3VisualStubViewModel,
  createB3VisualCandidateViewModel,
  createB3ExceptionFixtureViewModel,
  createB3FeedbackFixtureViewModel,
  createB3ClarificationFixtureViewModel,
  createB3CausalFixtureViewModel,
  B3_BASE_SOURCE_CODES,
} from "./b3-visual-stub";
export type {
  B3PresentationViewModel,
  B3SlotAnswer,
  B3SlotPresentation,
  B3ControlFamily,
  B3PresentationSurface,
} from "./b3-presentation-contract";
export { LocalCanvasB4InstrumentSection } from "./LocalCanvasB4InstrumentSection";
export type { LocalCanvasB4InstrumentSectionProps } from "./LocalCanvasB4InstrumentSection";
export {
  createB4VisualStubViewModel,
  createB4VisualCandidateViewModel,
  createB4ConditionalFixtureViewModel,
  createB4ClarificationFixtureViewModel,
  createB4CausalFixtureViewModel,
  B4_BASE_SOURCE_CODES,
} from "./b4-visual-stub";
export type {
  B4PresentationViewModel,
  B4SlotAnswer,
  B4SlotPresentation,
  B4ControlFamily,
  B4PresentationSurface,
} from "./b4-presentation-contract";
export { LocalCanvasB5InstrumentSection } from "./LocalCanvasB5InstrumentSection";
export type { LocalCanvasB5InstrumentSectionProps } from "./LocalCanvasB5InstrumentSection";
export {
  createB5VisualStubViewModel,
  createB5VisualCandidateViewModel,
  createB5ConditionalFixtureViewModel,
  createB5ClarificationFixtureViewModel,
  createB5DerivedFixtureViewModel,
  createB5MetricTimeFixtureViewModel,
  createB5CausalFixtureViewModel,
  B5_BASE_SOURCE_CODES,
} from "./b5-visual-stub";
export type {
  B5PresentationViewModel,
  B5SlotAnswer,
  B5SlotPresentation,
  B5ControlFamily,
  B5PresentationSurface,
} from "./b5-presentation-contract";
export type {
  LocalAuthCredentials,
  LocalAuthMode,
} from "./auth-types";
