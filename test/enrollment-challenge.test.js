import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewEnrollmentChallenge } from '../src/testnet/readiness/enrollment_challenge.js';
// SS58 of fixture bytes 0x07 repeated 32 times; no user account or private key.
const address = '5CDvHBym6RLoxTdX9MS1acpaDbNxaFagqM5LpBiFGjWT6o1n';
const genesisHash = '0x' + 'a'.repeat(64), nonce = 'b'.repeat(64), now = Date.parse('2026-11-16T00:00:00Z');
function fixture(purpose = null) {
  const lines = ['api.flop.network wants you to enroll a FLOP devnet gateway key with your account:', address, '', `Action: flop-devnet-enroll/${purpose ? 'v2' : 'v1'}`];
  if (purpose) lines.push(`Purpose: ${purpose}`);
  lines.push(`Genesis: ${genesisHash}`, `Nonce: ${nonce}`, `Issued At: ${new Date(now).toISOString()}`, `Expiration Time: ${new Date(now + 300000).toISOString()}`);
  return { address, genesisHash, now, purpose, challenge: { message: lines.join('\n'), nonce, expires_at: now + 300000 } };
}
test('exact v1 and purpose-bound v2 statements remain unsigned review candidates', () => {
  for (const purpose of [null, 'hermes-tools-v1']) {
    const r = reviewEnrollmentChallenge(fixture(purpose));
    assert.equal(r.signing_authorized, false); assert.equal(r.spending_authorized, false); assert.equal(r.human_approval_required, true);
  }
});
test('domain, address, genesis, action and hidden extra bytes cannot be substituted', () => {
  const f = fixture();
  for (const message of [f.challenge.message.replace('api.flop.network', 'evil.example'), f.challenge.message.replace(address, address.slice(0, -1) + 'h'), f.challenge.message.replace(genesisHash, '0x' + 'c'.repeat(64)), f.challenge.message.replace('enroll/v1', 'transfer/v1'), f.challenge.message + '\n', f.challenge.message.replaceAll('\n', '\r\n'), f.challenge.message + '\u200b']) assert.throws(() => reviewEnrollmentChallenge({ ...f, challenge: { ...f.challenge, message } }), /ENROLLMENT_CHALLENGE/);
  assert.throws(() => reviewEnrollmentChallenge({ ...f, gateway: 'https://api.flop.network.evil.example' }), /GATEWAY/);
  assert.throws(() => reviewEnrollmentChallenge({ ...f, address: address.slice(0, -1) + 'h' }), /CHECKSUM/);
});
test('expired, future, mismatched nonce and expiry metadata fail closed', () => {
  const f = fixture();
  for (const change of [{ now: now + 300000 }, { now: now - 1 }, { challenge: { ...f.challenge, nonce: 'c'.repeat(64) } }, { challenge: { ...f.challenge, expires_at: now + 300001 } }]) assert.throws(() => reviewEnrollmentChallenge({ ...f, ...change }), /ENROLLMENT_CHALLENGE/);
});
test('purpose cannot be added or removed outside the signed statement', () => {
  assert.throws(() => reviewEnrollmentChallenge({ ...fixture(), purpose: 'hermes-tools-v1' }), /STATEMENT/);
  assert.throws(() => reviewEnrollmentChallenge({ ...fixture('hermes-tools-v1'), purpose: null }), /STATEMENT/);
});
