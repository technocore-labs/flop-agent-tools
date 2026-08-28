import { generateKeyPairSync, createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { didFromPublicKey, fingerprint } from '../src/identity/did.js';

const root = resolve(import.meta.dirname, '..');
const privatePath = resolve(root, 'state/private/identity.seed');
const publicPath = resolve(root, 'state/public/identity.json');
if (existsSync(privatePath) || existsSync(publicPath)) throw new Error('identity already exists; refusing to overwrite');
mkdirSync(dirname(privatePath), { recursive: true, mode: 0o700 });
mkdirSync(dirname(publicPath), { recursive: true });
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const seed = privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32);
const publicRaw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
const did = didFromPublicKey(publicRaw);
writeFileSync(privatePath, seed, { mode: 0o600, flag: 'wx' });
try { chmodSync(privatePath, 0o600); } catch { /* Windows ACL is managed by the current account. */ }
writeFileSync(publicPath, JSON.stringify({ did, fingerprint: fingerprint(did), created_at: new Date().toISOString(), public_key_sha256: createHash('sha256').update(publicRaw).digest('hex') }, null, 2) + '\n', { mode: 0o644, flag: 'wx' });
console.log(JSON.stringify({ did, fingerprint: fingerprint(did), created_at: JSON.parse(await import('node:fs/promises').then(fs => fs.readFile(publicPath, 'utf8'))).created_at }, null, 2));
