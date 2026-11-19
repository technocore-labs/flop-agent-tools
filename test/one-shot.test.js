import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runOnce,prepareOneInference,evaluateCompletion} from '../src/testnet/readiness/one_shot.js';
test('lost response, body failure and persistence failure block restart replay',async()=>{
 for(const failure of ['TRANSPORT','RESPONSE_BODY','PERSISTENCE']){
 const dir=mkdtempSync(join(tmpdir(),'sov-one-shot-'));let calls=0;
 const transport=async()=>{calls++;if(failure==='TRANSPORT')throw Error('lost');return {status:200,text:async()=>{if(failure==='RESPONSE_BODY')throw Error('body');return '{}';}};};
 const a={dir,name:'inference',request:{id:'fixed'},transport,saveResponse:()=>{if(failure==='PERSISTENCE')throw Error('disk');}};
 const result=await runOnce(a);assert.equal(result.phase,failure);assert.equal(result.retry,false);await assert.rejects(runOnce(a),/EEXIST/);assert.equal(calls,1);
 assert.ok(!readFileSync(join(dir,'inference.stages.jsonl'),'utf8').includes('secret-bearer'));
 }});
test('success retains phase and known HTTP without claiming settlement',async()=>{const dir=mkdtempSync(join(tmpdir(),'sov-one-shot-'));const r=await runOnce({dir,name:'enrollment',request:{},transport:async()=>({status:503,text:async()=>'{"error":"cap"}'}),saveResponse:()=>{}});assert.equal(r.http,503);assert.equal(r.phase,'COMPLETE');});
test('exact budget and live scope required for single short request',()=>{
 const a={allowance:{expires_at:3000,models:['m']},model:'m',now:1000,networkVerified:true,authorized:true,budget:{approvedSpendRaw:'100',quotedSpendRaw:'90',additionalFeesRaw:'1',allowanceRaw:'100',quoteExpiresAt:2000}};
 assert.equal(prepareOneInference(a).stream,false);for(const patch of [{authorized:false},{allowance:{expires_at:999,models:['m']}},{budget:{...a.budget,additionalFeesRaw:'11'}}])assert.throws(()=>prepareOneInference({...a,...patch}));
});
test('HTTP 200 truncated/wrong response fails; usage and settlement separate',()=>{
 const j={id:'request-1',model:'m',choices:[{message:{content:'SOV_OK'},finish_reason:'stop'}],usage:{prompt_tokens:2,completion_tokens:3,total_tokens:5}};
 const r=evaluateCompletion({http:200,body:JSON.stringify(j),model:'m'});assert.equal(r.answer,true);assert.equal(r.usage_valid,true);assert.equal(r.chain_finality,'NOT_PROVEN');j.choices[0].finish_reason='length';assert.equal(evaluateCompletion({http:200,body:JSON.stringify(j),model:'m'}).answer,false);
});
test('untrusted null and non-string completions fail without crashing',()=>{
 for(const body of ['null','[]','7',JSON.stringify({model:'m',choices:[{message:{content:{text:'SOV_OK'}},finish_reason:'stop'}]})]){
 const r=evaluateCompletion({http:200,body,model:'m'});assert.equal(r.answer,false);assert.equal(r.retry,false);
 }
});
test('missing request identity or inconsistent usage cannot complete inference evidence',()=>{
 const j={model:'m',choices:[{message:{content:'SOV_OK'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:2,total_tokens:4}};
 const r=evaluateCompletion({http:200,body:JSON.stringify(j),model:'m'});assert.equal(r.answer,true);assert.equal(r.inference_evidence_complete,false);assert.equal(r.usage_valid,false);
});
test('truthy strings do not grant execution authority',()=>{
 assert.throws(()=>prepareOneInference({networkVerified:'false',authorized:'yes'}),/AUTHORITY/);
});
