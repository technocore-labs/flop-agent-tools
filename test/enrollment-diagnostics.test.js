import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseEnrollment } from '../src/testnet/readiness/enrollment_diagnostics.js';
test('funding does not override enrollment failure and no error causes wallet rotation', () => {
  for (const [errorCode, expected] of [['wallet_enrollment_cap_reached', 'SHARED_ENROLLMENT_CAP'], ['wallet_enrollment_unavailable', 'ISSUER_SERVICE_FAILURE'], ['503', 'UNKNOWN_ERROR']]) {
    const result = diagnoseEnrollment({ errorCode, walletFunded: true });
    assert.equal(result.status, expected); assert.equal(result.inference_authorized, false); assert.equal(result.retry, false); assert.equal(result.rotate_wallet, false);
  }
});
test('expiry, quota units and model scope remain independent fail-closed gates', () => {
  const input = { now: 1000, model: 'fixture-model', allowance: { expires_at: 2000, remaining_quota: '0.5', models: ['fixture-model'] } };
  assert.equal(diagnoseEnrollment(input).status, 'ALLOWANCE_FIELDS_CONSISTENT');
  for (const allowance of [{ ...input.allowance, expires_at: 999 }, { ...input.allowance, remaining_quota: Infinity }, { ...input.allowance, remaining_quota: '0.000' }, { ...input.allowance, models: [] }]) assert.notEqual(diagnoseEnrollment({ ...input, allowance }).status, 'ALLOWANCE_FIELDS_CONSISTENT');
  assert.equal(diagnoseEnrollment(input).inference_authorized, false);
});

test('official numeric quota is recognized only as non-authorizing FLOP allowance', () => {
  const r = diagnoseEnrollment({ now: 1000, model: 'm', allowance: { expires_at: 2000, remaining_quota: 0.5, models: ['m'] } });
  assert.equal(r.status, 'ALLOWANCE_FIELDS_CONSISTENT'); assert.equal(r.exact_spend_authority, false); assert.equal(r.inference_authorized, false);
  assert.equal(diagnoseEnrollment({ now: 1000, allowance: { expires_at: 2000, remaining_quota: -1 } }).status, 'QUOTA_SCHEMA_UNKNOWN');
});
