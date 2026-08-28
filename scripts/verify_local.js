import { createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { signTechnocore } from './sign_message.js';
import { signingMessage } from '../src/technocore/protocol.js';

const root = resolve(import.meta.dirname, '..');
const signed = signTechnocore(root, 'lobby', String(Date.now()), 'Local signature verification.');
const seed = readFileSync(resolve(root, 'state/private/identity.seed'));
const privateDer = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
const publicKey = createPublicKey({ key: privateDer, format: 'der', type: 'pkcs8' });
if (!verify(null, signingMessage(signed.room, signed.nonce, signed.text), publicKey, Buffer.from(signed.signature, 'base64url'))) throw new Error('signature verification failed');
console.log(JSON.stringify({ did: signed.did, signature_generation: 'PASS', signature_verification: 'PASS' }, null, 2));
