import { createHash } from 'node:crypto';

// Offline review only. Never creates a challenge, signs bytes or enrolls a wallet.
export function reviewEnrollmentChallenge({ challenge, address, genesisHash, gateway = 'https://api.flop.network', purpose = null, now = Date.now() } = {}) {
  const reject = reason => { throw new Error(`ENROLLMENT_CHALLENGE_${reason}`); };
  if (gateway !== 'https://api.flop.network') reject('GATEWAY');
  if (!/^0x[0-9a-f]{64}$/u.test(genesisHash ?? '') || !Number.isSafeInteger(now)) reject('CONTEXT');
  if (typeof address !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{47,49}$/u.test(address)) reject('ADDRESS');
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let n = 0n;
  for (const char of address) n = n * 58n + BigInt(alphabet.indexOf(char));
  let hex = n.toString(16); if (hex.length % 2) hex = `0${hex}`;
  const bytes = Buffer.from(hex, 'hex');
  if (bytes.length !== 35 || bytes[0] !== 42) reject('ADDRESS_PREFIX');
  const checksum = createHash('blake2b512').update(Buffer.concat([Buffer.from('SS58PRE'), bytes.subarray(0, 33)])).digest().subarray(0, 2);
  if (!checksum.equals(bytes.subarray(33))) reject('ADDRESS_CHECKSUM');
  if (purpose !== null && purpose !== 'hermes-tools-v1') reject('PURPOSE');
  const message = challenge?.message;
  if (typeof message !== 'string' || Buffer.byteLength(message) > 2048 || message.includes('\r') || /[^\x20-\x7e\n]/u.test(message)) reject('BYTES');
  const lines = message.split('\n');
  const version = purpose ? 'v2' : 'v1';
  const prefix = ['api.flop.network wants you to enroll a FLOP devnet gateway key with your account:', address, '', `Action: flop-devnet-enroll/${version}`];
  if (purpose) prefix.push(`Purpose: ${purpose}`);
  prefix.push(`Genesis: ${genesisHash}`);
  if (lines.length !== prefix.length + 3 || prefix.some((line, i) => lines[i] !== line)) reject('STATEMENT');
  const nonceLine = lines[prefix.length];
  if (!/^Nonce: [0-9a-f]{64}$/u.test(nonceLine) || challenge.nonce !== nonceLine.slice(7)) reject('NONCE');
  const issuedLine = lines[prefix.length + 1], expiryLine = lines[prefix.length + 2];
  const issued = Date.parse(issuedLine.slice('Issued At: '.length));
  const expires = Date.parse(expiryLine.slice('Expiration Time: '.length));
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || issuedLine !== `Issued At: ${new Date(issued).toISOString()}` || expiryLine !== `Expiration Time: ${new Date(expires).toISOString()}`) reject('TIMESTAMP');
  if (issued > now || expires <= now || expires <= issued || expires - issued > 300000 || challenge.expires_at !== expires) reject('EXPIRY');
  return Object.freeze({ status: 'STATEMENT_CONSISTENT_PENDING_HUMAN_REVIEW', network: 'DEVNET', action: `flop-devnet-enroll/${version}`, purpose, message_sha256: createHash('sha256').update(message, 'utf8').digest('hex'), canonicalization: 'EXACT_UTF8_NO_NORMALIZATION', expires_at: expires, human_approval_required: true, signing_authorized: false, spending_authorized: false, source_authenticity: 'MUST_BE_ESTABLISHED_BY_CALLER', did_binding: 'NOT_PROVEN', external_write: false });
}
