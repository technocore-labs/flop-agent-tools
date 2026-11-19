import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {createSensitiveScanner,auditPublication} from '../src/security/prepublish_scan.js';
const original=[/SIGN_SEED\s*=/i,/BEGIN (?:[A-Z ]+ )?PRIVATE KEY/,/\bseed\s*[:=]\s*['"][A-Za-z0-9+/_=-]{24,}/i,/[A-Z]:\\Users\\/i,/\/Users\//,/\/home\//];
const marker='SIGN'+'_SEED';const seed='se'+'ed';const key='PRI'+'VATE KEY';
function scan(text,width){const s=createSensitiveScanner();for(let i=0;i<text.length;i+=width)s.write(text.slice(i,i+width));return s.matched;}
test('streaming matcher preserves original detection across arbitrary chunk boundaries',()=>{
 const samples=[marker+' = fixture',seed+': "'+'a'.repeat(24),seed+': "aaa+seed'+'b'.repeat(24),'BEGIN '+key,'BEGIN XBEGIN  '+key,'BEGIN '+'RSA '.repeat(100)+key,'C:'+String.fromCharCode(92)+'Users'+String.fromCharCode(92)+'fixture','/'+['Users','fixture'].join('/'),'/'+['home','fixture'].join('/'),'notseed: "'+'a'.repeat(30),seed+': "'+'a'.repeat(23),'BEGIN x '+key,'plain safe text'];
 for(const s of samples)for(const width of [1,2,7,31,65536])assert.equal(scan(s,width),original.some(p=>p.test(s)),`width ${width}`);
});
test('unbounded whitespace and key-label repetitions do not fall outside a retained tail',()=>{
 for(const s of [marker+' '.repeat(70000)+'=',seed+' '.repeat(70000)+':'+ '\t'.repeat(70000)+'"'+'x'.repeat(24),'BEGIN '+'X'.repeat(70000)+' '+key])assert.equal(scan(s,4096),true);
});
function fixture(){const root=mkdtempSync(join(tmpdir(),'sov-audit-fixture-'));const git=args=>execFileSync('git',args,{cwd:root,stdio:'pipe',windowsHide:true});git(['init','--quiet']);git(['config','user.name','Audit Fixture']);git(['config','user.email','audit@example.invalid']);git(['config','commit.gpgsign','false']);writeFileSync(join(root,'README.md'),'Safe fixture\n');git(['add','.']);git(['commit','--quiet','-m','safe']);return {root,git};}
test('full history exceeds buffered defaults and still passes; README is also checked',async()=>{
 const {root,git}=fixture();try{writeFileSync(join(root,'large.txt'),'safe evidence row\n'.repeat(90000));git(['add','.']);git(['commit','--quiet','-m','large']);const r=await auditPublication(root);assert.ok(r.history_patch_bytes>1048576);writeFileSync(join(root,'README.md'),marker+'=');await assert.rejects(auditPublication(root),/README/);}finally{rmSync(root,{recursive:true,force:true});}
});
test('three historical negatives remain detectable after removal from current tree',async()=>{
 for(const kind of ['private-path','seed-pattern','absolute-path']){const {root,git}=fixture();try{
  const file=kind==='private-path'?join(root,'state','private','fixture.txt'):join(root,'fixture.txt');if(kind==='private-path')mkdirSync(join(root,'state','private'),{recursive:true});
  const body=kind==='seed-pattern'?seed+': "'+'synthetic'.repeat(4):kind==='absolute-path'?'/'+['home','fixture','file'].join('/'):'public synthetic fixture';
  writeFileSync(file,body);git(['add','.']);git(['commit','--quiet','-m','negative']);rmSync(file);git(['add','-u']);git(['commit','--quiet','-m','removed']);
  await assert.rejects(auditPublication(root),kind==='private-path'?/private path exists in Git history/:/sensitive content or absolute user path exists in Git history/);
 }finally{rmSync(root,{recursive:true,force:true});}}
});
test('a failed Git invocation cannot produce a pass',async()=>{const root=mkdtempSync(join(tmpdir(),'sov-not-repo-'));try{writeFileSync(join(root,'README.md'),'safe');await assert.rejects(auditPublication(root),/AUDIT_GIT_PROCESS_FAILED/);}finally{rmSync(root,{recursive:true,force:true});}});
test('UTF-8 whitespace crossing file-stream boundaries is not lost',async()=>{
 const {root}=fixture();try{writeFileSync(join(root,'README.md'),'x'.repeat(65529)+' '+seed+'\u2003:\u2003"'+'a'.repeat(24));await assert.rejects(auditPublication(root),/README/);}finally{rmSync(root,{recursive:true,force:true});}
});
