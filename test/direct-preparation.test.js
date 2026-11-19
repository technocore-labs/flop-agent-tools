import test from 'node:test';import assert from 'node:assert/strict';
import {createPayloadAdapter} from '../tools/wallet-proof-verifier/payload-adapter.mjs';
import {readDirectChannel} from '../src/testnet/readiness/direct_readback.js';
const hash='0x'+'a'.repeat(64),channelId='0x'+'b'.repeat(64);
const payload=()=>({address:'fixture-agent',genesisHash:hash,specVersion:1014027,transactionVersion:2,blockHash:hash,method:'0x0102',nonce:'0x00',signedExtensions:[]});
const signature='0x'+'0'.repeat(128); // Synthetic; never evidence of valid signing.
function setup(signPayload=async()=>({signature}),reserveAttempt=async()=>{}){
 let calls=0;const adapter=createPayloadAdapter({injected:{enable:async()=>({accounts:{get:async()=>[{address:'fixture-agent'}]},signer:{signPayload:async p=>{calls++;return signPayload(p);}}})},address:'fixture-agent',genesisHash:hash,specVersion:1014027,transactionVersion:2,reserveAttempt});
 return {adapter,calls:()=>calls};
}
test('review binds an immutable payload and requires explicit approval; never broadcasts',async()=>{
 let received;const s=setup(async p=>{received=p;return {signature};});await s.adapter.connect();const p=payload();const review=await s.adapter.prepare(p);p.method='0x9999';review.payload.method='0x8888';
 await assert.rejects(s.adapter.sign({digest:review.digest,approved:'true'}),/REVIEW/);
 const result=await s.adapter.sign({digest:review.digest,approved:true});assert.equal(received.method,'0x0102');assert.equal(result.broadcast,false);assert.match(result.status,/REQUIRES_VERIFICATION/);
 await assert.rejects(s.adapter.sign({digest:review.digest,approved:true}),/ATTEMPT/);assert.equal(s.calls(),1);
});
test('wallet rejection or reservation failure cannot automatically request another signature',async()=>{
 for(const beforeWallet of [false,true]){const s=setup(async()=>{throw Error('USER_REJECTED');},async()=>{if(beforeWallet)throw Error('ATTEMPT_EXISTS');});await s.adapter.connect();const r=await s.adapter.prepare(payload());await assert.rejects(s.adapter.sign({digest:r.digest,approved:true}));await assert.rejects(s.adapter.sign({digest:r.digest,approved:true}),/ATTEMPT/);assert.equal(s.calls(),beforeWallet?0:1);}
});
test('disconnect discards late signature and blocks concurrent signing',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});const s=setup(async()=>{await gate;return {signature};});await s.adapter.connect();const r=await s.adapter.prepare(payload());const first=s.adapter.sign({digest:r.digest,approved:true});
 await assert.rejects(s.adapter.sign({digest:r.digest,approved:true}),/ATTEMPT/);s.adapter.disconnect();release();await assert.rejects(first,/CONNECTION_CHANGED/);assert.ok(s.calls()<=1);
});
test('wrong network/runtime/account is rejected before requesting wallet signature',async()=>{
 const s=setup();await s.adapter.connect();for(const patch of [{address:'other'},{genesisHash:channelId},{specVersion:1014020},{transactionVersion:3}])await assert.rejects(s.adapter.prepare({...payload(),...patch}),/CONTEXT/);assert.equal(s.calls(),0);
});
test('channel readback uses exact ID, GET only; unavailable or absent is not retry authority',async()=>{
 for(const http of [404,503]){const result=await readDirectChannel({channelId,expectedAgent:'agent',expectedMiner:'miner',fetcher:async(url,o)=>{assert.ok(url.endsWith(channelId));assert.equal(o.method,'GET');assert.equal(o.redirect,'error');return {status:http,text:async()=>'{}'};}});assert.equal(result.retry,false);assert.equal(result.submit_authorized,false);assert.equal(result.chain_finality,'NOT_PROVEN');}
});
test('wrong-party receipt rejected, terminal indexer state never proves finalized payment',async()=>{
 for(const wrong of [false,true]){const c={channelId,agent:wrong?'other':'agent',miner:'miner',status:'settled',paymentStatus:'PAID'};const result=await readDirectChannel({channelId,expectedAgent:'agent',expectedMiner:'miner',fetcher:async()=>({status:200,text:async()=>JSON.stringify(c)})});assert.equal(result.status,wrong?'CHANNEL_IDENTITY_MISMATCH':'INDEXER_OBSERVATION_ONLY');assert.equal(result.chain_finality,'NOT_PROVEN');assert.equal(result.allocation_credit,'UNKNOWN');}
 let calls=0;await assert.rejects(readDirectChannel({channelId:'../bad',expectedAgent:'agent',expectedMiner:'miner',fetcher:()=>{calls++;}}));assert.equal(calls,0);
});
