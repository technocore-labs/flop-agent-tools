import {readFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {executeOne} from '../src/testnet/readiness/execute_one.js';
const root=resolve(import.meta.dirname,'..'),privateRoot=resolve(root,'state/private');
const args=process.argv.slice(2);if(args.length!==3)throw Error('Usage: node scripts/execute_one_inference.js <private credential JSON> <approved plan JSON> <private operation directory>');
const paths=args.map(p=>resolve(root,p));if(paths.some(p=>!p.startsWith(privateRoot+sep)))throw Error('PRIVATE_PATHS_REQUIRED');
const saved=JSON.parse(readFileSync(paths[0],'utf8'));const plan=JSON.parse(readFileSync(paths[1],'utf8'));
const result=await executeOne({credential:saved.key,plan,dir:paths[2]});console.log(JSON.stringify(result,null,2));
