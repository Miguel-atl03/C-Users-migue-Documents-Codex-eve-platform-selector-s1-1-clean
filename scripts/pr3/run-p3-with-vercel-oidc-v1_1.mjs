import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root=path.resolve(import.meta.dirname,"../..");
const tmp=path.join(root,".tmp");
const frozenDir=path.join(root,"pr3/evidence");
fs.mkdirSync(tmp,{recursive:true});
fs.mkdirSync(frozenDir,{recursive:true});

function shaFile(file){return createHash("sha256").update(fs.readFileSync(file)).digest("hex");}
function extractToken(text){
  const candidates=[];
  const visit=(value,key="")=>{
    if(typeof value==="string"){
      if(/token|oidc|value/i.test(key)) candidates.unshift(value); else candidates.push(value);
    }else if(Array.isArray(value)) value.forEach(v=>visit(v,key));
    else if(value&&typeof value==="object") for(const [k,v] of Object.entries(value)) visit(v,k);
  };
  try{visit(JSON.parse(text));}catch{}
  for(const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) candidates.push(match[0]);
  return candidates.find(v=>typeof v==="string"&&v.length>80&&v.split(".").length===3)??null;
}
function run(command,args,env=process.env){
  return spawnSync(command,args,{cwd:root,encoding:"utf8",windowsHide:true,env,maxBuffer:20*1024*1024});
}
function acquireOidc(){
  if(process.env.VERCEL_OIDC_TOKEN?.trim()) return {token:process.env.VERCEL_OIDC_TOKEN.trim(),source:"existing_env"};
  if(process.env.AI_GATEWAY_API_KEY?.trim()) return {token:null,source:"ai_gateway_api_key_existing"};
  const attempts=[
    ["vercel",["project","token","eve-pr3-pilot","--format=json","--scope","miguelatalav-9585"]],
    ["vercel",["project","token","eve-pr3-pilot","--scope","miguelatalav-9585"]],
    ["npx",["--yes","vercel@latest","project","token","eve-pr3-pilot","--format=json","--scope","miguelatalav-9585"]],
  ];
  const failures=[];
  for(const [cmd,args] of attempts){
    const r=run(cmd,args);
    const token=extractToken((r.stdout??"")+"\n"+(r.stderr??""));
    if(r.status===0&&token) return {token,source:`${cmd} project token`};
    failures.push({cmd,status:r.status,error:(r.stderr??"").replace(/eyJ[A-Za-z0-9_.-]+/g,"<redacted>").slice(-500)});
  }
  const error=new Error("VERCEL_OIDC_TOKEN_ACQUISITION_FAILED");
  error.failures=failures; throw error;
}
function freeze(src,name){
  if(!fs.existsSync(src)) return null;
  const dst=path.join(frozenDir,name);
  fs.copyFileSync(src,dst);
  return {path:path.relative(root,dst).replaceAll("\\","/"),sha256:shaFile(dst)};
}

const receipt={
  artifact_id:"P3-A10-CODEX-EXECUTION-RECEIPT-v1.1",
  executed_at:new Date().toISOString(),
  source_head:null,
  auth_source:null,
  p3:{exit_code:null,evidence:null},
  a10:{exit_code:null,decision_input:null},
  secrets_logged:false,
};

const git=run("git",["rev-parse","HEAD"]);
if(git.status===0) receipt.source_head=git.stdout.trim();

let auth;
try{
  auth=acquireOidc();
  receipt.auth_source=auth.source;
}catch(error){
  receipt.determination="BLOCKED__VERCEL_OIDC_TOKEN_ACQUISITION_FAILED";
  receipt.details=error.failures??[];
  fs.writeFileSync(path.join(frozenDir,"P3_A10_EXECUTION_RECEIPT_v1_1.json"),JSON.stringify(receipt,null,2));
  console.error(JSON.stringify({determination:receipt.determination,details:receipt.details},null,2));
  process.exit(3);
}

const env={...process.env};
if(auth.token) env.VERCEL_OIDC_TOKEN=auth.token;
const p3=run(process.execPath,["scripts/pr3/run-p3-ai-qualification-v1_1.mjs"],env);
receipt.p3.exit_code=p3.status;
process.stdout.write(p3.stdout??"");
process.stderr.write(p3.stderr??"");
receipt.p3.evidence=freeze(path.join(tmp,"P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_1.json"),"P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_1.json");

if(!receipt.p3.evidence){
  receipt.determination="P3_EXECUTION_FAILED_WITHOUT_EVIDENCE";
  fs.writeFileSync(path.join(frozenDir,"P3_A10_EXECUTION_RECEIPT_v1_1.json"),JSON.stringify(receipt,null,2));
  process.exit(p3.status||4);
}
const p3Evidence=JSON.parse(fs.readFileSync(path.join(frozenDir,"P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_1.json"),"utf8"));
if(p3.status!==0||p3Evidence.qualification_determination!=="EVIDENCE_READY_FOR_A10_AUTHORITY_DETERMINATION"){
  receipt.determination="P3_CONFORMANCE_NOT_CLOSED";
  receipt.p3.qualification_determination=p3Evidence.qualification_determination;
  receipt.p3.hard_falsifier_count=Array.isArray(p3Evidence.hard_falsifiers)?p3Evidence.hard_falsifiers.length:null;
  fs.writeFileSync(path.join(frozenDir,"P3_A10_EXECUTION_RECEIPT_v1_1.json"),JSON.stringify(receipt,null,2));
  process.exit(p3.status||2);
}

const a10=run(process.execPath,["scripts/pr3/run-a10-evaluator-authority-decision-v1_1.mjs",path.join(frozenDir,"P3_PR3_PRODUCTION_AI_QUALIFICATION_EVIDENCE_v1_1.json")],env);
receipt.a10.exit_code=a10.status;
process.stdout.write(a10.stdout??"");
process.stderr.write(a10.stderr??"");
receipt.a10.decision_input=freeze(path.join(tmp,"A10_PR3_EVALUATOR_AUTHORITY_DECISION_INPUT_v1_1.json"),"A10_PR3_EVALUATOR_AUTHORITY_DECISION_INPUT_v1_1.json");
receipt.determination=a10.status===0&&receipt.a10.decision_input?"P3_CLOSED__A10_READY_FOR_CENTER_AUTHORITY_DECISION":"A10_NOT_READY_OR_REJECTED";
fs.writeFileSync(path.join(frozenDir,"P3_A10_EXECUTION_RECEIPT_v1_1.json"),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({determination:receipt.determination,p3_evidence:receipt.p3.evidence,a10_decision_input:receipt.a10.decision_input,receipt:"pr3/evidence/P3_A10_EXECUTION_RECEIPT_v1_1.json"},null,2));
process.exit(a10.status||0);
