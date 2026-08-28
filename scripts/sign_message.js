import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { signingMessage } from '../src/technocore/protocol.js';

export function signTechnocore(root, room, nonce, text) {
  const seed = readFileSync(resolve(root, 'state/private/identity.seed'));
  if (seed.length !== 32) throw new Error('invalid local signing key');
  const identity = JSON.parse(readFileSync(resolve(root, 'state/public/identity.json'), 'utf8'));
  const key = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
  const message = signingMessage(room, nonce, text);
  const signature = sign(null, message, key).toString('base64url');
  if (signature.length !== 86) throw new Error('unexpected Ed25519 signature encoding');
  return { did: identity.did, room, nonce: String(nonce), text: message.toString('utf8').split('|').slice(2).join('|'), signature };
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [, , room, nonce, text] = process.argv;
  if (!text) throw new Error('usage: sign_message.js <room> <nonce> <text>');
  console.log(JSON.stringify(signTechnocore(resolve(import.meta.dirname, '..'), room, nonce, text), null, 2));
}
