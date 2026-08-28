import { createHash } from 'node:crypto';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes) {
  let value = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  let out = '';
  while (value > 0n) { out = ALPHABET[Number(value % 58n)] + out; value /= 58n; }
  for (const byte of bytes) { if (byte === 0) out = '1' + out; else break; }
  return out || '1';
}
export function didFromPublicKey(rawPublicKey) {
  if (!Buffer.isBuffer(rawPublicKey) || rawPublicKey.length !== 32) throw new Error('Ed25519 public key must be 32 bytes');
  return 'did:key:z' + base58(Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey]));
}
export function fingerprint(did) { return createHash('sha256').update(did, 'utf8').digest('hex').slice(0, 16); }
