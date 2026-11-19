import {readBoundedBody} from './bounded_body.js';
const HASH=/^0x[0-9a-f]{64}$/;
// Explorer readback is an observation, never storage-proof or signing authority.
export async function readDirectChannel({channelId,expectedAgent,expectedMiner,fetcher=fetch}={}){
 if(!HASH.test(channelId??'')||typeof expectedAgent!=='string'||!expectedAgent||typeof expectedMiner!=='string'||!expectedMiner)throw Error('ORIGINAL_CHANNEL_IDENTITIES_REQUIRED');
 const base={channel_id:channelId,retry:false,submit_authorized:false,network_write:false,chain_finality:'NOT_PROVEN',allocation_credit:'UNKNOWN'};
 let http=null,body=null;
 try{const r=await fetcher('https://explorer.devnet.flop.network/api/compute-channels/'+channelId,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000)});http=r.status;body=await readBoundedBody(r);
  if(http!==200)return {...base,http,body,status:http===404?'CHANNEL_NOT_FOUND_NOT_PROOF_OF_NO_SUBMISSION':'READBACK_UNAVAILABLE'};
  const c=JSON.parse(body);
  if(c?.channelId!==channelId||c.agent!==expectedAgent||c.miner!==expectedMiner)return {...base,http,body,status:'CHANNEL_IDENTITY_MISMATCH'};
  const state=typeof c.status==='string'?c.status.toLowerCase():null;
  if(!['open','pendingack','settling','settled','timedout','expired','closed','voided'].includes(state))return {...base,http,body,status:'CHANNEL_SCHEMA_UNKNOWN'};
  return {...base,http,body,status:'INDEXER_OBSERVATION_ONLY',observed_state:state,payment_status:typeof c.paymentStatus==='string'?c.paymentStatus:'UNKNOWN',action:'VERIFY_FINALIZED_STORAGE_AND_TERMINAL_EVENTS_BEFORE_RECOVERY'};
 }catch{return {...base,http,body,status:'READBACK_UNAVAILABLE'};}
}
