import {createHash} from 'node:crypto';
import {readBoundedBody} from '../testnet/readiness/bounded_body.js';

export const SOURCES=Object.freeze({
  yellowpaper:'https://api.github.com/repos/flop-labs/yellowpaper/git/ref/heads/main',
  timeline:'https://docs.flop.network/docs/testnet-and-timeline',
  conversion:'https://docs.flop.network/docs/airdrop-and-testnet-conversion',
  onboarding:'https://docs.flop.network/docs/agent-onboarding',
  integration:'https://docs.flop.network/docs/agent-integration',
  direct:'https://docs.flop.network/docs/send-to-specific-miner',
  sdk:'https://docs.flop.network/docs/sdk-references',
  official:'https://docs.flop.network/docs/official-links'
});
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const MAX_BYTES=1048576;
const LIMIT=4;

// Inert public text only. No credentials, SDK execution, semantic approval or scheduler.
export async function collect({ids,fetchImpl=fetch,pace=()=>new Promise(r=>setTimeout(r,1000)),timeoutMs=15000}={}){
  if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!Object.hasOwn(SOURCES,id)))throw Error('INVALID_SOURCES');
  if(ids.length+(ids.includes('yellowpaper')?1:0)>LIMIT)throw Error('REQUEST_BUDGET');
  const records=[];let requests=0;
  async function get(url){
    if(requests)await pace();requests++;
    const response=await fetchImpl(url,{method:'GET',redirect:'error',credentials:'omit',headers:{accept:'text/html, text/plain, application/json','user-agent':'SOV-readonly-spec-watch'},signal:AbortSignal.timeout(timeoutMs)});
    if(response.status!==200)throw Error('HTTP_NOT_200');
    const type=response.headers.get('content-type')??'';
    if(!/^(text\/(plain|html)|application\/json)\b/i.test(type))throw Error('CONTENT_TYPE');
    return await readBoundedBody(response,MAX_BYTES);
  }
  for(const id of ids){
    const at=new Date().toISOString();
    try{
      let url=SOURCES[id],revision=null,refHash=null;
      if(id==='yellowpaper'){
        const ref=await get(url);const obj=JSON.parse(ref);
        if(obj.ref!=='refs/heads/main'||obj.object?.type!=='commit'||!(/^[a-f0-9]{40}$/.test(obj.object?.sha??'')))throw Error('REF_INVALID');
        revision=obj.object.sha;refHash=digest(ref);
        url=`https://raw.githubusercontent.com/flop-labs/yellowpaper/${revision}/yellowpaper.md`;
      }
      const body=await get(url);
      if(!body.trim())throw Error('EMPTY_BODY');
      records.push({id,url,at,status:'CAPTURED',revision,ref_sha256:refHash,sha256:digest(body),bytes:Buffer.byteLength(body),body});
    }catch{
      // Do not copy server text or exception values into logs.
      records.push({id,url:SOURCES[id],at,status:'UNKNOWN',reason:'READ_FAILED_OR_INVALID_RESPONSE'});
    }
  }
  return {records,requests};
}

export function validateCapture(record){
  if(!record||!Object.hasOwn(SOURCES,record.id)||record.status!=='CAPTURED'||typeof record.body!=='string'||Buffer.byteLength(record.body)>MAX_BYTES||!record.body.trim())throw Error('INVALID_CAPTURE');
  const url=record.id==='yellowpaper'&&/^[a-f0-9]{40}$/.test(record.revision??'')?
    `https://raw.githubusercontent.com/flop-labs/yellowpaper/${record.revision}/yellowpaper.md`:SOURCES[record.id];
  if(record.id==='yellowpaper'&&!/^[a-f0-9]{40}$/.test(record.revision??''))throw Error('INVALID_REVISION');
  if(record.url!==url||digest(record.body)!==record.sha256||Buffer.byteLength(record.body)!==record.bytes)throw Error('CAPTURE_INTEGRITY');
  return true;
}

export function compare(previous=[],current=[]){
  for(const list of [previous,current]){
    if(!Array.isArray(list)||new Set(list.map(x=>x.id)).size!==list.length)throw Error('DUPLICATE_OR_INVALID_RECORDS');
    for(const r of list){if(r.status==='CAPTURED')validateCapture(r);else if(r.status!=='UNKNOWN'||!Object.hasOwn(SOURCES,r.id))throw Error('INVALID_RECORD');}
  }
  const old=new Map(previous.map(x=>[x.id,x]));
  return current.map(r=>{
    const p=old.get(r.id);
    const status=r.status!=='CAPTURED'?'UNKNOWN':p?.status!=='CAPTURED'?'BASELINE_MISSING':p.sha256!==r.sha256?'CONTENT_CHANGED':p.revision!==r.revision?'REVISION_CHANGED_CONTENT_SAME':'UNCHANGED';
    let lineCounts=null;
    if(status==='CONTENT_CHANGED'){
      const a=p.body.split('\n'),b=r.body.split('\n');let start=0,end=0;
      while(start<Math.min(a.length,b.length)&&a[start]===b[start])start++;
      while(end<Math.min(a.length,b.length)-start&&a[a.length-1-end]===b[b.length-1-end])end++;
      lineCounts={first_changed_line:start+1,old_span:a.length-start-end,new_span:b.length-start-end};
    }
    return {id:r.id,status,previous_sha256:p?.sha256??null,current_sha256:r.sha256??null,revision:r.revision??null,line_counts:lineCounts,
      review_ticket:['CONTENT_CHANGED','REVISION_CHANGED_CONTENT_SAME','BASELINE_MISSING'].includes(status)?{ticket:'A-7-REVIEW',source:r.id,disposition:'HUMAN_REVIEW_REQUIRED',suggested_impact:['A-2','A-6'],interpretation:'NOT_DECIDED'}:null};
  });
}
