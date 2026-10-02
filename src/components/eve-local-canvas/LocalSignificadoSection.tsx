"use client";



import {

  LocalCanvasSignificadoBuilder,

  type LocalCanvasSignificadoBuilderProps,

} from "./LocalCanvasSignificadoBuilder";



export type LocalSignificadoSectionProps = LocalCanvasSignificadoBuilderProps;



/**

 * Official B0 / SIGNIFICADO section — continuous-canvas freeze bands.

 * Presentation: LocalCanvasSignificadoBuilder (SignificadoC visual).

 * Function authority remains SignificadoEditor contracts (B0 keys, prefill,

 * coach, boundary panel, draft submit, /api/significado/block0 via page onContinue).

 * SignificadoEditor stays in repo for e2e-block0 / standalone; official path

 * does not mount its table chrome.

 */

export function LocalSignificadoSection(props: LocalSignificadoSectionProps) {

  return <LocalCanvasSignificadoBuilder {...props} />;

}


