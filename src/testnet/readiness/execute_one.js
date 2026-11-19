import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {runOnce,prepareOneInference,evaluateCompletion} from './one_shot.js';
import {reviewGatewayReceipt} from './gateway_receipt.js';
import {readBoundedBody} from './bounded_body.js';

const GENESIS='0x99c172c095340ace980631f9123544c6bebd4839f3437e463533422d8be2d631';
// Credential is supplied by the caller privately, never returned or logged.
// No retries or enrollment are performed. All HTTP calls use the fixed origin.
export async function executeOne({credential,plan,dir,fetcher=fetch,now=()=>Date.now()}){
 if(typeof credential!=='string'||!credential||/[\r\n]/.test(credential))throw Error('CREDENTIAL_REQUIRED');
 const rehearsal=plan?.mode==='DEVNET_SINGLE_SHORT_REHEARSAL';
 if(plan?.network!=='DEVNET'||plan?.approved!==true||(!rehearsal&&(plan?.quote_verified!==true||plan?.cap_enforced!==true)))throw Error('APPROVED_ENFORCEABLE_QUOTE_REQUIRED');
 const call=(path,options={})=>fetcher('https://api.flop.network'+path,{...options,headers:{...options.headers,Authorization:`Bearer ${credential}`},redirect:'error',signal:AbortSignal.timeout(30000)});
 const health=await call('/health');if(health.status!==200)throw Error('GATEWAY_UNHEALTHY');
 const h=JSON.parse(await readBoundedBody(health));if(h.network?.observed_genesis_hash!==GENESIS||h.connected!==true)throw Error('NETWORK_IDENTITY');
 const auth=await call('/v1/keys/me');if(auth.status!==200)throw Error('AUTH_HTTP_'+auth.status);
 const a=JSON.parse(await readBoundedBody(auth));
 // Current keys/me exposes ephemeral permissions under scope. Never use a
 // catalog or saved enrollment model to expand authenticated permissions.
 const models=Array.isArray(a.scope?.models)?a.scope.models:Array.isArray(a.models)?a.models:typeof a.model==='string'?[a.model]:[];
 // Live quota is FLOP: convert decimal text exactly, never through multiplication.
 const decimal=String(a.remaining_quota);if(!/^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$/.test(decimal))throw Error('LIVE_QUOTA_UNSUPPORTED');
 const [whole,fraction='']=decimal.split('.');const raw=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
 if(raw<=0n)throw Error('LIVE_QUOTA_EXHAUSTED');
 if(!Number.isSafeInteger(a.expires_at)||a.expires_at<=now()||!models.includes(plan.model))throw Error('ALLOWANCE_SCOPE_OR_EXPIRY');
 if(!rehearsal&&raw<BigInt(plan.budget.allowanceRaw))throw Error('LIVE_QUOTA_BELOW_PLAN');
 const request=rehearsal?{model:plan.model,messages:[{role:'user',content:'Reply with exactly SOV_OK and nothing else.'}],max_tokens:16,stream:false}:prepareOneInference({allowance:{expires_at:a.expires_at,models},model:plan.model,budget:plan.budget,now:now(),networkVerified:true,authorized:true});
 const result=await runOnce({dir,name:'inference',request,transport:r=>call('/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r)}),saveResponse:(body,http)=>writeFileSync(join(dir,'completion.secret'),JSON.stringify({http,body}),{flag:'wx',mode:0o600})});
 if(result.phase!=='COMPLETE')return {status:'RECONCILIATION_REQUIRED',phase:result.phase,http:result.http,retry:false};
 const completion=evaluateCompletion({http:result.http,body:result.body,model:plan.model});
 const summary={completion,receipt:{status:'NO_VERIFIED_REQUEST_ID'},retry:false,mode:rehearsal?'DEVNET_SINGLE_SHORT_REHEARSAL':'STRICT_QUOTED',total_cost_cap_proven:false,cap_operator_attested:!rehearsal};
 if(completion.request_id){
  try{const response=await call('/v1/keys/me/receipts/'+encodeURIComponent(completion.request_id));const text=await readBoundedBody(response);writeFileSync(join(dir,'receipt.secret'),JSON.stringify({http:response.status,body:text}),{flag:'wx',mode:0o600});
  let receipt;try{receipt=JSON.parse(text);}catch{}
  summary.receipt=reviewGatewayReceipt({httpStatus:response.status,receipt,expected:{request_id:completion.request_id,correlation_id:plan.expected_correlation_id,model:plan.model}});
  }catch{summary.receipt={status:'READBACK_UNAVAILABLE',retry:false};}
 }
 writeFileSync(join(dir,'summary.json'),JSON.stringify(summary,null,2),{flag:'wx',mode:0o600});return summary;
}
