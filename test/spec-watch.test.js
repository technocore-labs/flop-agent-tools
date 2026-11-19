import test from 'node:test';import assert from 'node:assert/strict';
import {collect,compare,digest,SOURCES,MAX_BYTES} from '../src/research/spec_watch.js';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
const record=(body='version one')=>({id:'timeline',url:SOURCES.timeline,status:'CAPTURED',body,sha256:digest(body),bytes:Buffer.byteLength(body),revision:null});
test('changed text generates review without ratifying meaning; unchanged and missing remain distinct',()=>{
 const a=record('first\nold\nlast'),b=record('first\nnew\nlast');const c=compare([a],[b])[0];
 assert.equal(c.status,'CONTENT_CHANGED');assert.deepEqual(c.line_counts,{first_changed_line:2,old_span:1,new_span:1});assert.equal(c.review_ticket.interpretation,'NOT_DECIDED');
 assert.equal(compare([a],[a])[0].status,'UNCHANGED');assert.equal(compare([],[a])[0].status,'BASELINE_MISSING');
 assert.equal(compare([a],[{id:'timeline',status:'UNKNOWN'}])[0].status,'UNKNOWN');
});
test('tampered baseline or source URL and duplicate observations are rejected',()=>{
 for(const a of [{...record(),body:'tampered'},{...record(),url:'https://example.invalid/'}])assert.throws(()=>compare([a],[record()]));
 assert.throws(()=>compare([record(),record()],[]));
});
test('manual collection uses only fixed public GETs with redirects and credentials disabled',async()=>{
 const r=await collect({ids:['timeline'],fetchImpl:async(url,init)=>{assert.equal(url,SOURCES.timeline);assert.equal(init.method,'GET');assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');assert.equal(init.headers.authorization,undefined);return new Response('official text',{headers:{'content-type':'text/html'}});}});
 assert.equal(r.requests,1);assert.equal(compare([],r.records)[0].status,'BASELINE_MISSING');
});
test('unavailable, redirect failure, non-text and oversized sources stay UNKNOWN',async()=>{
 for(const fetchImpl of [async()=>new Response('down',{status:503}),async()=>{throw Error('redirect')},async()=>new Response('binary',{headers:{'content-type':'image/png'}}),async()=>new Response('x'.repeat(MAX_BYTES+1),{headers:{'content-type':'text/plain'}})]){
  const r=await collect({ids:['timeline'],fetchImpl});assert.equal(r.records[0].status,'UNKNOWN');assert.equal(r.records[0].body,undefined);
 }
});
test('yellowpaper head is resolved then fetched at immutable revision within request budget',async()=>{
 const sha='a'.repeat(40);const urls=[];const r=await collect({ids:['yellowpaper'],pace:async()=>{},fetchImpl:async(url)=>{urls.push(url);return new Response(urls.length===1?JSON.stringify({ref:'refs/heads/main',object:{type:'commit',sha}}):'paper',{headers:{'content-type':urls.length===1?'application/json':'text/plain'}});}});
 assert.equal(r.requests,2);assert.equal(urls[1],`https://raw.githubusercontent.com/flop-labs/yellowpaper/${sha}/yellowpaper.md`);assert.equal(r.records[0].revision,sha);assert.equal(compare([],r.records)[0].status,'BASELINE_MISSING');
 await assert.rejects(collect({ids:['yellowpaper','timeline','conversion','onboarding']}),/REQUEST_BUDGET/);
 await assert.rejects(collect({ids:['not-official']}),/INVALID_SOURCES/);
});
test('revision-only changes produce review, invalid reference never fetches raw body',async()=>{
 const a={...record(),id:'yellowpaper',revision:'a'.repeat(40),url:`https://raw.githubusercontent.com/flop-labs/yellowpaper/${'a'.repeat(40)}/yellowpaper.md`};
 const b={...a,revision:'b'.repeat(40),url:`https://raw.githubusercontent.com/flop-labs/yellowpaper/${'b'.repeat(40)}/yellowpaper.md`};
 assert.equal(compare([a],[b])[0].status,'REVISION_CHANGED_CONTENT_SAME');
 const r=await collect({ids:['yellowpaper'],fetchImpl:async()=>new Response('{}',{headers:{'content-type':'application/json'}})});assert.equal(r.requests,1);assert.equal(r.records[0].status,'UNKNOWN');
});
test('offline CLI does not inherit historical request counts and refuses output overwrite',()=>{
 const dir=mkdtempSync(join(tmpdir(),'spec-watch-'));
 try{
  const input=join(dir,'input.json'),out=join(dir,'out');writeFileSync(input,JSON.stringify({records:[record()],requests:4}));
  const args=['scripts/spec_watch.js','--baseline',input,'--current',input,'--output',out];
  const r=spawnSync(process.execPath,args,{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(readFileSync(join(out,'report.json'),'utf8'));assert.equal(report.requests,0);assert.equal(report.mode,'OFFLINE');assert.equal(report.baseline_advanced,false);
  const bytes=readFileSync(join(out,'report.json'),'utf8');assert.notEqual(spawnSync(process.execPath,args,{windowsHide:true}).status,0);assert.equal(readFileSync(join(out,'report.json'),'utf8'),bytes);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
