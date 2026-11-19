import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {resolve} from 'node:path';
import {StringDecoder} from 'node:string_decoder';

// Incremental equivalents of the original audit expressions. Unbounded whitespace
// and uppercase private-key labels require state, not a finite overlap window.
export function createSensitiveScanner(){
 let tail='',sign=false,seed=0,count=0,label=false,labelLength=0,labelTail='',matched=false;
 return {write(text){
  if(matched)return;
  if(!sign&&!seed&&!label&&!/SIGN_SEED|seed|BEGIN |[A-Z]:\\Users\\|\/Users\/|\/home\//i.test(tail+text)){tail=(tail+text).slice(-32);return;}
  for(const c of text){
  if(matched)continue;
  const space=/\s/.test(c);
  if(sign){if(c==='=')matched=true;else if(!space)sign=false;}
  if(seed===1){if(c===':'||c==='=')seed=2;else if(!space)seed=0;}
  else if(seed===2){if(c==='"'||c==="'"){seed=3;count=0;}else if(!space)seed=0;}
  else if(seed===3){if(/[A-Za-z0-9+/_=-]/.test(c)){if(++count>=24)matched=true;}else seed=0;}
  if(label){if(/[A-Z ]/.test(c)){labelLength++;labelTail=(labelTail+c).slice(-12);if((labelLength===11&&labelTail==='PRIVATE KEY')||(labelLength>=13&&labelTail===' PRIVATE KEY'))matched=true;}else label=false;}
  tail=(tail+c).slice(-32);
  if(/SIGN_SEED$/i.test(tail))sign=true;
  if(seed!==3&&/(?:^|[^A-Za-z0-9_])seed$/i.test(tail))seed=1;
  if(!label&&tail.endsWith('BEGIN ')){label=true;labelLength=0;labelTail='';}
  if(/[A-Z]:\\Users\\/i.test(tail)||/\/Users\//.test(tail)||/\/home\//.test(tail))matched=true;
 }},get matched(){return matched;}};
}

function createPrivatePathScanner(){
 const names=['state/private','private','secrets','credentials'];let prefix='',active=true,matched=false;
 return {write(text){for(const c of text){
  if(c==='\n'||c==='\0'){if(active&&names.includes(prefix))matched=true;prefix='';active=true;continue;}
  if(!active)continue;
  if(c==='/'&&names.includes(prefix))matched=true;
  prefix+=c;if(!names.some(name=>name.startsWith(prefix)))active=false;
 }},get matched(){return matched;}};
}

async function inspectStream(stream,scanner){const decoder=new StringDecoder('utf8');let bytes=0;for await(const chunk of stream){bytes+=chunk.length;scanner.write(decoder.write(chunk));}scanner.write(decoder.end());scanner.write('\0');return {matched:scanner.matched,bytes};}

async function gitScan(root,args,scanner){
 const child=spawn('git',args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stderr.resume();
 const completion=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));});
 const [scan,status]=await Promise.all([inspectStream(child.stdout,scanner),completion]);
 if(status.code!==0)throw Error('AUDIT_GIT_PROCESS_FAILED');return scan;
}

export async function auditPublication(root){
 const tracked=await gitScan(root,['ls-files','-z'],createPrivatePathScanner());
 const names=await gitScan(root,['log','--all','--name-only','--format=','-z','--no-color'],createPrivatePathScanner());
 const history=await gitScan(root,['log','--all','-p','--format=','--no-color','--no-ext-diff','--no-textconv'],createSensitiveScanner());
 const readme=await inspectStream(createReadStream(resolve(root,'README.md')),createSensitiveScanner());
 // Drain every stream and check every git exit, including when a match is found.
 if(tracked.matched)throw Error('private path is tracked');
 if(names.matched)throw Error('private path exists in Git history');
 if(history.matched)throw Error('sensitive content or absolute user path exists in Git history');
 if(readme.matched)throw Error('README contains sensitive content or an absolute user path');
 return {tracked_bytes:tracked.bytes,history_name_bytes:names.bytes,history_patch_bytes:history.bytes,readme_bytes:readme.bytes};
}
