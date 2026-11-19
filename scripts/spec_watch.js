import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {collect,compare,digest,MAX_BYTES} from '../src/research/spec_watch.js';

// Default is offline. A fresh output directory and explicit inputs are mandatory.
async function main(){
  const args=process.argv.slice(2),opts={};
  for(let i=0;i<args.length;i++){
    const key=args[i];if(!['--live','--sources','--baseline','--current','--output'].includes(key)||Object.hasOwn(opts,key))throw Error('ARGS');
    opts[key]=key==='--live'?true:args[++i];if(opts[key]===undefined)throw Error('ARGS');
  }
  if(!opts['--output']||(!opts['--live']&&!opts['--current'])||(opts['--live']&&opts['--current'])||(opts['--live']&&!opts['--sources']))throw Error('ARGS');
  async function load(path){
    if(!path)return {records:[]};
    const {open}=await import('node:fs/promises');const file=await open(path,'r');
    try{if((await file.stat()).size>9*MAX_BYTES)throw Error('INPUT_SIZE');const data=JSON.parse(await file.readFile('utf8'));if(!Array.isArray(data.records)||data.records.length>8)throw Error('INPUT_SCHEMA');return data;}finally{await file.close();}
  }
  const baseline=await load(opts['--baseline']);
  const out=resolve(opts['--output']);await mkdir(out); // no recursive/overwrite
  const current=opts['--live']?await collect({ids:opts['--sources'].split(',')}):await load(opts['--current']);
  const changes=compare(baseline.records,current.records);
  const report={ticket:'A-7',at:new Date().toISOString(),mode:opts['--live']?'MANUAL_READ_ONLY':'OFFLINE',requests:opts['--live']?current.requests:0,
    baseline_sha256:digest(JSON.stringify(baseline)),capture_sha256:digest(JSON.stringify(current)),changes,
    official_spec_current:false,baseline_advanced:false,semantic_review:'PENDING',scheduler_enabled:false,autonomous_posting:false,remote_state_mutations:0};
  await writeFile(resolve(out,'captures.json'),JSON.stringify(current,null,2)+'\n',{flag:'wx'});
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:'RECORDED',requests:report.requests,changes:changes.map(x=>({id:x.id,status:x.status})),scheduler_enabled:false}));
}
main().catch(()=>{console.error('SPEC_WATCH_FAILED: invalid input, existing output, or capture integrity failure. No baseline advanced.');process.exitCode=1;});
