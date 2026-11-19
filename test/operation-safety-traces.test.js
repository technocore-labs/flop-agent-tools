import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runOnce,evaluateCompletion} from '../src/testnet/readiness/one_shot.js';

// Fixed offline traces: every dispatch point is followed by a concurrent replay,
// then restart-style replay after completion or failure. No real API or signer.
test('bounded interleavings preserve one dispatch across late responses and restart',async()=>{
 for(const outcome of ['success','refusal','transport-lost','body-lost','disk-full','null-thrown']){
  const dir=mkdtempSync(join(tmpdir(),'sov-safety-trace-'));
  try{
   let calls=0,release;const gate=new Promise(resolve=>{release=resolve;});
   const args={dir,name:'inference',request:{operation_id:'fixed-offline-operation'},
    transport:async()=>{calls++;await gate;if(outcome==='transport-lost')throw Error('timeout');if(outcome==='null-thrown')throw null;return {status:outcome==='refusal'?503:200,text:async()=>{if(outcome==='body-lost')throw Error('truncated');return '{}';}};},
    saveResponse:async()=>{if(outcome==='disk-full')throw Error('disk');}};
   const first=runOnce(args);
   await assert.rejects(runOnce({...args,request:{operation_id:'changed-payload'}}),/EEXIST/);
   release();const result=await first;
   assert.equal(result.retry,false,outcome);
   if(!['success','refusal'].includes(outcome))assert.equal(result.status,'UNKNOWN_COMMIT_STATE',outcome);
   for(let restart=0;restart<3;restart++)await assert.rejects(runOnce(args),/EEXIST/);
   assert.equal(calls,1,outcome);
   assert.equal(JSON.parse(readFileSync(join(dir,'inference.attempt.json'),'utf8')).state,'UNKNOWN_COMMIT_STATE');
  }finally{rmSync(dir,{recursive:true,force:true});}
 }
});

test('cross-product of response evidence cannot promote incomplete inference or settlement',()=>{
 let cases=0;
 for(const http of [200,503])for(const correctModel of [true,false])for(const shape of ['single','object','multiple','empty'])for(const identity of [true,false])for(const validUsage of [true,false]){
  const choice={message:{content:'SOV_OK'},finish_reason:'stop'};
  const choices=shape==='single'?[choice]:shape==='object'?{0:choice}:shape==='multiple'?[choice,choice]:[];
  const body=JSON.stringify({id:identity?'fixed-id':null,model:correctModel?'m':'other',choices,usage:{prompt_tokens:1,completion_tokens:1,total_tokens:validUsage?2:3}});
  const result=evaluateCompletion({http,body,model:'m'});
  assert.equal(result.inference_evidence_complete,http===200&&correctModel&&shape==='single'&&identity&&validUsage,body);
  assert.equal(result.retry,false);assert.equal(result.chain_finality,'NOT_PROVEN');assert.equal(result.settlement,'READ_RECEIPT_SEPARATELY');cases++;
 }
 assert.equal(cases,64);
});

test('journal failure before or after dispatch returns unknown and preserves replay fence',async()=>{
 for(const timing of ['before-dispatch','after-dispatch']){
  const dir=mkdtempSync(join(tmpdir(),'sov-journal-failure-'));
  try{
   const journal=join(dir,'inference.stages.jsonl');let calls=0,saves=0;
   if(timing==='before-dispatch')mkdirSync(journal);
   const args={dir,name:'inference',request:{id:'offline-fixture'},transport:async()=>{
    calls++;unlinkSync(journal);mkdirSync(journal);
    return {status:200,text:async()=>'{}'};
   },saveResponse:async()=>{saves++;}};
   const result=await runOnce(args);
   assert.equal(result.status,'UNKNOWN_COMMIT_STATE');assert.equal(result.retry,false);
   assert.equal(result.journal_error,true);assert.equal(saves,0);
   assert.equal(calls,timing==='before-dispatch'?0:1);
   await assert.rejects(runOnce(args),/EEXIST/);
   assert.equal(calls,timing==='before-dispatch'?0:1);
   assert.equal(JSON.parse(readFileSync(join(dir,'inference.attempt.json'),'utf8')).state,'UNKNOWN_COMMIT_STATE');
  }finally{rmSync(dir,{recursive:true,force:true});}
 }
});
