import {openSync,writeSync,fsyncSync,closeSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {reviewInferenceBudget} from './gateway_receipt.js';
import {readBoundedBody} from './bounded_body.js';

// A durable exclusive marker is created BEFORE any network callback. It is never
// cleared automatically, including after explicit refusals or local save failure.
export async function runOnce({dir,name,request,transport,saveResponse}) {
  if(!/^[a-z-]+$/.test(name))throw Error('INVALID_OPERATION_NAME');
  mkdirSync(dir,{recursive:true});
  const marker=join(dir,`${name}.attempt.json`);
  const hash=createHash('sha256').update(JSON.stringify(request)).digest('hex');
  const fd=openSync(marker,'wx',0o600);
  try{writeSync(fd,JSON.stringify({state:'UNKNOWN_COMMIT_STATE',request_hash:hash,at:new Date().toISOString()}));fsyncSync(fd);}finally{closeSync(fd);}
  const stages=[];const record=(stage,details={})=>{
    const f=openSync(join(dir,`${name}.stages.jsonl`),'a',0o600);
    try{writeSync(f,JSON.stringify({stage,at:new Date().toISOString(),...details})+'\n');fsyncSync(f);}finally{closeSync(f);}
    stages.push(stage);
  };
  let phase='BEFORE_TRANSPORT',http=null;
  try{
    record('DISPATCH_BEGIN');phase='TRANSPORT';const r=await transport(request);
    http=r.status;record('HEADERS_RECEIVED',{http});phase='RESPONSE_BODY';
    const body=await readBoundedBody(r);record('BODY_RECEIVED',{bytes:Buffer.byteLength(body)});
    phase='PERSISTENCE';await saveResponse(body,http);record('RESPONSE_SAVED',{http});
    return {http,body,phase:'COMPLETE',stages,retry:false};
  }catch(error){
    // A failed journal must not make the conservative outcome disappear while
    // trying to journal that same failure. The exclusive attempt fence remains.
    let journal_error=false;
    try{record('FAILED',{phase,http,error_type:error instanceof Error?error.name:'NonErrorThrown'});}catch{journal_error=true;}
    return {phase,http,status:'UNKNOWN_COMMIT_STATE',retry:false,stages,...(journal_error?{journal_error:true}:{})};
  }
}

export function prepareOneInference({allowance,model,budget,now=Date.now(),networkVerified,authorized}){
  if(networkVerified!==true||authorized!==true)throw Error('EXECUTION_AUTHORITY_REQUIRED');
  if(!Number.isSafeInteger(now)||!Number.isSafeInteger(allowance?.expires_at)||allowance.expires_at<=now||!Array.isArray(allowance.models)||!allowance.models.includes(model))throw Error('ALLOWANCE_SCOPE_OR_EXPIRY');
  const reviewed=reviewInferenceBudget({...budget,model,allowedModels:allowance.models,now});
  if(reviewed.status==='BLOCKED')throw Error(reviewed.reason);
  return {model,messages:[{role:'user',content:'Reply with exactly SOV_OK and nothing else.'}],max_tokens:16,stream:false};
}

export function evaluateCompletion({http,body,model}){
  let j;try{j=JSON.parse(body);}catch{return {transport:http===200,answer:false,status:'INVALID_JSON',retry:false};}
  if(!j||typeof j!=='object'||Array.isArray(j))return {transport:http===200,answer:false,status:'INVALID_SCHEMA',retry:false};
  const text=j.choices?.[0]?.message?.content;
  const usage=j.usage;
  const answer=http===200&&j.model===model&&Array.isArray(j.choices)&&j.choices.length===1&&typeof text==='string'&&text.trim()==='SOV_OK'&&j.choices[0]?.finish_reason==='stop';
  const request_id=typeof j.id==='string'&&j.id.length>0&&j.id.length<=256?j.id:null;
  const usage_valid=Boolean(usage&&!Array.isArray(usage)&&['prompt_tokens','completion_tokens','total_tokens'].every(k=>Number.isSafeInteger(usage[k])&&usage[k]>=0)&&usage.total_tokens===usage.prompt_tokens+usage.completion_tokens);
  return {transport:http===200,model_match:j.model===model,answer,request_id,usage_valid,inference_evidence_complete:answer&&usage_valid&&request_id!==null,settlement:'READ_RECEIPT_SEPARATELY',chain_finality:'NOT_PROVEN',retry:false};
}
