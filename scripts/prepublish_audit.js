import {resolve} from 'node:path';
import {auditPublication} from '../src/security/prepublish_scan.js';
await auditPublication(resolve(import.meta.dirname,'..'));
console.log('Pre-publication audit: PASS');
