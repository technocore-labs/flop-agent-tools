import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {reviewGatewayReceipt} from './gateway_receipt.js';
import {readBoundedBody} from './bounded_body.js';

// Restart-safe readback only: never creates an operation, enrollment or POST.
export async function reconcileOne({dir,credential,expected,fetcher=fetch}){
 if(typeof credential!=='string'||!credential||/[\r\n]/.test(credential))throw Error('CREDENTIAL_REQUIRED');
 const saved=JSON.parse(readFileSync(join(dir,'completion.secret'),'utf8'));
 let completion;try{completion=JSON.parse(saved.body);}catch{throw Error('ORIGINAL_RESPONSE_UNREADABLE');}
 const id=completion?.id??completion?.request_id;
 if(typeof id!=='string'||!id||id.length>256)throw Error('ORIGINAL_REQUEST_ID_UNAVAILABLE_ISSUER_RECONCILIATION_REQUIRED');
 if(expected?.request_id!==id)throw Error('ORIGINAL_REQUEST_ID_MISMATCH');
 const key=new Date().toISOString().replaceAll(':','-')+'-'+randomUUID();
 let result;
 try{
 const response=await fetcher('https://api.flop.network/v1/keys/me/receipts/'+encodeURIComponent(id),{method:'GET',headers:{Authorization:'Bearer '+credential},redirect:'error',signal:AbortSignal.timeout(20000)});
 const body=await readBoundedBody(response);writeFileSync(join(dir,'readback-'+key+'.secret'),JSON.stringify({http:response.status,body}),{flag:'wx',mode:0o600});
 let receipt;try{receipt=JSON.parse(body);}catch{}
 result={...reviewGatewayReceipt({httpStatus:response.status,receipt,expected}),response_sha256:createHash('sha256').update(body).digest('hex')};
 }catch{result={status:'READBACK_UNAVAILABLE',retry:false,submit_authorized:false};}
 const summary={...result,checked_at:new Date().toISOString(),original_request_id:id,network_write:false};
 writeFileSync(join(dir,'readback-'+key+'.json'),JSON.stringify(summary,null,2),{flag:'wx',mode:0o600});return summary;
}
