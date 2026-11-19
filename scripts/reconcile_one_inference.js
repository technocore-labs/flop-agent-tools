import {readFileSync} from 'node:fs';import {resolve,sep} from 'node:path';
import {reconcileOne} from '../src/testnet/readiness/reconcile_one.js';
const root=resolve(import.meta.dirname,'..'),base=resolve(root,'state/private');
const args=process.argv.slice(2);if(args.length!==3)throw Error('Usage: <private credential JSON> <private expected identity JSON> <original private operation directory>');
const paths=args.map(p=>resolve(root,p));if(paths.some(p=>!p.startsWith(base+sep)))throw Error('PRIVATE_PATHS_REQUIRED');
const credential=JSON.parse(readFileSync(paths[0],'utf8')).key;const expected=JSON.parse(readFileSync(paths[1],'utf8'));
console.log(JSON.stringify(await reconcileOne({dir:paths[2],credential,expected}),null,2));
