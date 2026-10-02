"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RuntimeInteractionSheet, type RuntimePresentationViewModel } from "@/components/eve-worksheet";
import {
  PR3_CHAIN_DEFINITION_ID,
  PR3_CHAIN_DEFINITION_REVISION,
  PR3_RUNTIME_API,
  type Pr3ActionTokenRequest,
  type Pr3ExecutionResult,
  type Pr3InteractionContract,
} from "@/services/eve/pr3/contracts";

export type Pr3PilotUiScope = {
  scopeRef: string;
  activityRef: string;
  principalRef?: string;
};

type Props = { scope: Pr3PilotUiScope; accessToken: string; activityTitle?: string; disabled?: boolean; onComplete?: () => void };

function toPresentation(contract: Pr3InteractionContract): RuntimePresentationViewModel {
  const choices = contract.slots.flatMap((slot) => slot.options ?? []).map((o) => ({ option_id:o.option_ref, option_label:o.option_label }));
  return {
    runtime_interaction_id: contract.runtime_definition_id,
    visible_text: contract.visible_text,
    help_text: contract.help_text ?? undefined,
    block: contract.object_key,
    ui_component: contract.ui_component,
    slots: contract.slots.map((s) => ({
      slot_ref:s.slot_ref,
      name:s.field_key,
      label:s.label,
      required:s.required,
      type:s.control_family,
      answer_mode:s.answer_mode,
      options:s.options?.map((o)=>({option_id:o.option_ref,option_label:o.option_label})),
      source_code:s.source_code,
      help_text:s.help_text ?? undefined,
      capture_slot_kind:s.capture_slot_kind,
    })),
    choice_options: choices.length ? choices : undefined,
    presentation_mode: choices.length ? "authorized_choice" : "fallback_textarea",
  };
}

function localHeaders(scope: Pr3PilotUiScope, accessToken: string) {
  const headers: Record<string,string> = { "Content-Type":"application/json", Authorization: `Bearer ${accessToken}` };
  if (process.env.NEXT_PUBLIC_EVE_PR3_LOCAL_QA === "true") {
    headers["x-eve-pr3-principal-ref"] = scope.principalRef ?? "local-pr3-operator";
    headers["x-eve-pr3-scope-ref"] = scope.scopeRef;
    headers["x-eve-pr3-activity-ref"] = scope.activityRef;
  }
  return headers;
}

async function jsonFetch<T>(url:string, init:RequestInit):Promise<T>{
  const response=await fetch(url,init); const payload=await response.json();
  if(!response.ok) throw new Error(payload.client_safe_message ?? payload.error ?? `HTTP ${response.status}`);
  return payload as T;
}

export function Pr3PilotRuntimeRunner({ scope, accessToken, activityTitle, disabled=false, onComplete }:Props){
  const [result,setResult]=useState<Pr3ExecutionResult|null>(null);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [message,setMessage]=useState("Preparando piloto PR3…");
  const [busy,setBusy]=useState(false);
  const [fatal,setFatal]=useState<string|null>(null);
  const started=useRef(false);
  const storageKey=useMemo(()=>`eve:pr3:chain:${scope.principalRef}:${scope.scopeRef}:${scope.activityRef}`,[scope]);

  const headers=useMemo(()=>localHeaders(scope,accessToken),[scope,accessToken]);

  const issueToken=useCallback(async(operation:Pr3ActionTokenRequest["operation"], bind?:Partial<Pr3ActionTokenRequest>)=>{
    const token_request_id=crypto.randomUUID();
    const body:Pr3ActionTokenRequest={token_request_id,operation,scope_ref:scope.scopeRef,activity_ref:scope.activityRef,...bind};
    // Network retry reuses the exact token_request_id and body.
    type IssuedToken = { action_token: string; client_event_id: string };
    try{return await jsonFetch<IssuedToken>(PR3_RUNTIME_API.actionToken,{method:"POST",headers,body:JSON.stringify(body)});}
    catch(first){return await jsonFetch<IssuedToken>(PR3_RUNTIME_API.actionToken,{method:"POST",headers,body:JSON.stringify(body)}).catch(()=>{throw first;});}
  },[headers,scope]);

  const startOrResume=useCallback(async()=>{
    setBusy(true); setFatal(null);
    try{
      const prior=window.sessionStorage.getItem(storageKey);
      if(prior){
        const state=await fetch(`${PR3_RUNTIME_API.state}?chain_run_id=${encodeURIComponent(prior)}`,{headers}).then(async r=>({ok:r.ok,p:await r.json()}));
        if(state.ok && state.p?.projection){
          // State endpoint is a pure read. To resume with side effects/re-render, obtain RESUME token.
          const token=await issueToken("RESUME",{chain_run_id:prior});
          const resumed=await jsonFetch<Pr3ExecutionResult>(PR3_RUNTIME_API.resume,{method:"POST",headers,body:JSON.stringify({action_token:token.action_token,client_event_id:token.client_event_id,chain_run_id:prior})});
          setResult(resumed); setAnswers({}); setMessage(""); return;
        }
      }
      const token=await issueToken("OPEN_OR_RESUME");
      const opened=await jsonFetch<Pr3ExecutionResult>(PR3_RUNTIME_API.openOrResume,{method:"POST",headers,body:JSON.stringify({action_token:token.action_token,client_event_id:token.client_event_id,mode:"OPEN_OR_RESUME",scope_ref:scope.scopeRef,activity_ref:scope.activityRef,expected_chain_definition_id:PR3_CHAIN_DEFINITION_ID,expected_chain_definition_revision:PR3_CHAIN_DEFINITION_REVISION})});
      window.sessionStorage.setItem(storageKey,opened.domain_state.chain_run_id); setResult(opened); setAnswers({}); setMessage("");
    }catch(e){const msg=e instanceof Error?e.message:"No pudimos abrir el piloto PR3.";setFatal(msg);setMessage(msg);}finally{setBusy(false);}
  },[headers,issueToken,scope,storageKey]);

  useEffect(()=>{if(started.current)return;started.current=true;void startOrResume();},[startOrResume]);

  const contract=result?.next_projection.kind==="interaction_contract"?result.next_projection.value:null;
  const viewModel=contract?toPresentation(contract):null;

  const submit=async()=>{
    if(!contract||!result)return;
    const missing=contract.slots.find(s=>s.required&&!String(answers[s.slot_ref]??"").trim());
    if(missing){setMessage(`Falta responder: ${missing.label}`);return;}
    setBusy(true);setMessage("Guardando respuesta…");
    try{
      const token=await issueToken("SUBMIT_RESPONSE",{chain_run_id:result.domain_state.chain_run_id,object_run_id:result.domain_state.object_run_id,interaction_key:contract.interaction_key,context_revision:contract.context_revision});
      const command={action_token:token.action_token,client_event_id:token.client_event_id,chain_run_id:result.domain_state.chain_run_id,object_run_id:result.domain_state.object_run_id,interaction_key:contract.interaction_key,context_revision:contract.context_revision,answers:contract.slots.filter(s=>String(answers[s.slot_ref]??"").trim()).map(s=>({slot_ref:s.slot_ref,raw_value:answers[s.slot_ref],raw_literal:answers[s.slot_ref]}))};
      const next=await jsonFetch<Pr3ExecutionResult>(PR3_RUNTIME_API.respond,{method:"POST",headers,body:JSON.stringify(command)});
      setResult(next);setAnswers({});setMessage("");
      if(next.next_projection.kind==="chain_complete_package_ref"){window.sessionStorage.removeItem(storageKey);onComplete?.();}
    }catch(e){setMessage(e instanceof Error?e.message:"No pudimos registrar la respuesta.");}finally{setBusy(false);}
  };

  if(fatal&&!viewModel) return <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950"><strong>Piloto PR3 bloqueado de forma segura.</strong><div className="mt-2">{fatal}</div><button className="mt-4 rounded-lg border px-3 py-2" onClick={()=>void startOrResume()}>Reintentar</button></div>;
  if(result?.next_projection.kind==="reentry_descriptor") return <div className="mx-auto max-w-3xl rounded-2xl border p-6"><h2 className="font-semibold">Necesitamos reentrar antes de continuar</h2><p className="mt-2 text-sm">La evidencia previa se conserva; no se convirtió el faltante en una respuesta.</p><button className="mt-4 rounded-lg border px-3 py-2" onClick={()=>void startOrResume()}>Reanudar</button></div>;
  if(result?.next_projection.kind==="dependency_block") return <div className="mx-auto max-w-3xl rounded-2xl border p-6">Dependencia PR3 todavía no disponible.</div>;
  if(result?.next_projection.kind==="chain_complete_package_ref") return <div className="mx-auto max-w-3xl rounded-2xl border p-6">Captura piloto B0→B2 completada para este alcance.</div>;
  return <RuntimeInteractionSheet activityTitle={activityTitle} answers={answers} disabled={disabled||busy} message={message} preferSlotOptions onChange={(slotRef,value)=>setAnswers(p=>({...p,[slotRef]:value}))} onSubmit={submit} saving={busy} viewModel={viewModel}/>;
}
