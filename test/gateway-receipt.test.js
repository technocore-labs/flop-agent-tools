import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewGatewayReceipt, reviewInferenceBudget } from '../src/testnet/readiness/gateway_receipt.js';
const expected = { request_id: 'case-Sensitive-id', correlation_id: 'task-1', model: 'fixture-model' };
const receipt = { ...expected, reserved_spend: 0.01, settled_spend: null, settled_spend_raw: null, terminal_event: null, channel_id: null, created_at: 1000, state: 'estimated', response_status: 200 };
test('HTTP success is not settlement; null exact amount is never inferred as zero', () => {
  const r = reviewGatewayReceipt({ httpStatus: 200, receipt, expected });
  assert.equal(r.status, 'UNRESOLVED_GATEWAY_RESERVATION'); assert.equal(r.exact_allocated_spend_raw, null); assert.equal(r.chain_finality, 'NOT_PROVEN'); assert.equal(r.retry, false);
});
test('gateway terminal allocation retains exact integers but never becomes a per-request chain payment', () => {
  const r = reviewGatewayReceipt({ httpStatus: 200, receipt: { ...receipt, state: 'settled', settled_spend: 0.009, settled_spend_raw: '9007199254740993', terminal_event: 'pooled-event', channel_id: 'channel' }, expected });
  assert.equal(r.exact_allocated_spend_raw, '9007199254740993'); assert.equal(r.status, 'TERMINAL_GATEWAY_LEDGER_ONLY'); assert.equal(r.per_request_payment_hash, 'NOT_ESTABLISHED'); assert.equal(r.allocation_credit, 'UNKNOWN');
});
test('404, timeout and expired authority never authorize replacement paid work', () => {
  for (const httpStatus of [404, 401, 403, 503, null]) assert.equal(reviewGatewayReceipt({ httpStatus }).retry, false);
  assert.match(reviewGatewayReceipt({ httpStatus: 404 }).status, /NOT_PROOF_OF_NO_CHARGE/);
});
test('wrong request/model, malformed exact amount and missing fields fail closed', () => {
  for (const change of [{ request_id: 'case-sensitive-id' }, { model: 'another-model' }, { settled_spend_raw: 9007199254740992 }, { settled_spend_raw: '-1' }, { settled_spend_raw: '1e18' }, { state: 'success' }]) assert.notEqual(reviewGatewayReceipt({ httpStatus: 200, expected, receipt: { ...receipt, ...change } }).status, 'UNRESOLVED_GATEWAY_RESERVATION');
  const incomplete = { ...receipt }; delete incomplete.settled_spend_raw;
  assert.equal(reviewGatewayReceipt({ httpStatus: 200, expected, receipt: incomplete }).status, 'RECEIPT_SCHEMA_UNKNOWN');
});
test('budget uses exact raw units, explicit fees, model scope and expiry without enabling submission', () => {
  const x = { approvedSpendRaw: '9007199254740994', quotedSpendRaw: '9007199254740993', additionalFeesRaw: '1', allowanceRaw: '9007199254740994', model: 'm', allowedModels: ['m'], quoteExpiresAt: 2000, now: 1000 };
  const r = reviewInferenceBudget(x); assert.equal(r.total_raw, '9007199254740994'); assert.equal(r.executable, false);
  for (const change of [{ additionalFeesRaw: null }, { additionalFeesRaw: '2' }, { quoteExpiresAt: 999 }, { allowedModels: [] }, { approvedSpendRaw: 9007199254740994 }]) assert.equal(reviewInferenceBudget({ ...x, ...change }).status, 'BLOCKED');
});
