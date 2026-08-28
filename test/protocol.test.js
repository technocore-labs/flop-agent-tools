import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, verify } from 'node:crypto';
import { didFromPublicKey } from '../src/identity/did.js';
import { sanitizeText, signingMessage } from '../src/technocore/protocol.js';
test('Technocore single-line sweep and exact signing payload', () => {
  assert.equal(sanitizeText(' hi\nthere\u200b '), 'hi there');
  assert.equal(signingMessage('lobby', 1, 'hello').toString(), 'lobby|1|hello');
});
test('DID is official Ed25519 did:key shape', () => {
  const { publicKey } = generateKeyPairSync('ed25519');
  const did = didFromPublicKey(publicKey.export({format:'der', type:'spki'}).subarray(-32));
  // 0xed01 + 32-byte public key base58btc encodes to the canonical 48-char multibase value.
  assert.match(did, /^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/);
});
test('runtime-generated key signs and verifies UTF-8 payload', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519'); const payload = signingMessage('lobby', 42, '日本語の検証'); const sig = sign(null, payload, privateKey);
  assert.equal(verify(null, payload, publicKey, sig), true); assert.equal(sig.toString('base64url').length, 86);
});
