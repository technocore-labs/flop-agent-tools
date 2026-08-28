import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
if (process.argv[2] !== 'status') throw new Error('usage: flop-agent status');
const identityPath = resolve(root, 'state/public/identity.json');
const hasIdentity = existsSync(identityPath);
console.log(`DID: ${hasIdentity ? 'READY' : 'PENDING'}\nSecret isolation: ${existsSync(resolve(root, 'state/private/identity.seed')) ? 'PASS' : 'PENDING'}\nSigner: ${hasIdentity ? 'PASS' : 'PENDING'}\nTechnocore protocol: CURRENT\nIntroduction: PENDING\nContribution: PENDING\nEvidence: OK\nTestnet: NOT STARTED\nFaucet: UNKNOWN\nSnapshot: UNKNOWN\nClaim: UNKNOWN${hasIdentity ? `\nFingerprint: ${JSON.parse(readFileSync(identityPath, 'utf8')).fingerprint}` : ''}`);
