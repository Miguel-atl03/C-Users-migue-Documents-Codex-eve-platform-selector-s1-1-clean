"use client";

import {
  LocalCanvasWorkMapBuilder,
  type LocalCanvasWorkMapBuilderProps,
} from "./LocalCanvasWorkMapBuilder";

export type LocalWorkMapSectionProps = LocalCanvasWorkMapBuilderProps;

/**
 * Local WORKMAP section — continuous-canvas band UI (freeze WorkmapBuilder).
 * Function authority remains WorkMapData + assistance + draft + save/continue.
 * WorkMapEditor stays in repo for legacy/e2e; local canvas path does not mount its sidebar.
 */
export function LocalWorkMapSection(props: LocalWorkMapSectionProps) {
  return <LocalCanvasWorkMapBuilder {...props} />;
}
