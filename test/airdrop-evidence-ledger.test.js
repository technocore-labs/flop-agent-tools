import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { AutonomousEvidenceLedger } from '../src/autonomous/evidence_ledger.js';
import { appendAirdropEvidence, summarizeAirdropEvidence } from '../src/testnet/readiness/airdrop_ledger.js';

function ledger() {
  const root = mkdtempSync(resolve(tmpdir(), 'sov-airdrop-ledger-'));
  mkdirSync(resolve(root, 'state/public'), { recursive: true });
  return new AutonomousEvidenceLedger(resolve(root, 'state/public/airdrop-evidence.jsonl'));
}
function event(overrides = {}) {
  return { id: 'faucet-1', timestamp: '2026-11-06T00:00:00Z', type: 'FAUCET_RECEIVED', network: 'TESTNET', evidence_ref: 'capture:faucet', evidence_hash: 'a'.repeat(64), verification_status: 'UNVERIFIED', source_authority: 'UNKNOWN', ...overrides };
}

test('airdrop evidence chain keeps faucet receipt separate from eligibility and allocation', () => {
  const store = ledger();
  appendAirdropEvidence(store, event());
  const summary = summarizeAirdropEvidence(store);
  assert.equal(summary.chain_valid, true);
  assert.equal(summary.verified_event_counts.FAUCET_RECEIVED, 0);
  assert.equal(summary.faucet_receipt_is_allocation, false);
  assert.equal(summary.eligibility, 'UNKNOWN');
  assert.equal(summary.allocation_score, 'UNKNOWN');
  assert.equal(summary.allocation_amount, 'UNKNOWN');
  assert.equal(summary.claimability, 'UNKNOWN');
  assert.equal(summary.spendable_amount, 'UNKNOWN');
});

test('verified event requires separate verifier proof and mock evidence never counts', () => {
  const store = ledger();
  assert.throws(() => appendAirdropEvidence(store, event({ verification_status: 'VERIFIED' })), /VERIFIER_PROOF/);
  appendAirdropEvidence(store, event({ id: 'mock-faucet', verification_status: 'VERIFIED', verifier_evidence_hash: 'b'.repeat(64), mock: true }));
  assert.equal(summarizeAirdropEvidence(store).verified_event_counts.FAUCET_RECEIVED, 0);
});

test('inference retry with the same operation is idempotent and changed request is rejected', () => {
  const store = ledger();
  const request = event({ id: 'request-1', type: 'INFERENCE_REQUESTED', operation_id: 'op-1', request_hash: 'c'.repeat(64), idempotency_key: 'd'.repeat(64) });
  assert.equal(appendAirdropEvidence(store, request).status, 'APPENDED');
  assert.equal(appendAirdropEvidence(store, { ...request, id: 'request-retry-1' }).status, 'DUPLICATE_OPERATION');
  assert.throws(() => appendAirdropEvidence(store, { ...request, id: 'request-retry-2', request_hash: 'e'.repeat(64) }), /IDEMPOTENCY_CONFLICT/);
  assert.equal(store.read().filter(row => row.type === 'AIRDROP_EVIDENCE').length, 1);
});

test('settlement and finality cannot appear without their preceding verified evidence', () => {
  const store = ledger();
  const common = { operation_id: 'op-2', request_hash: 'c'.repeat(64), idempotency_key: 'd'.repeat(64) };
  assert.throws(() => appendAirdropEvidence(store, event({ ...common, type: 'INFERENCE_SETTLED' })), /WITHOUT_RECORDED_REQUEST/);
  appendAirdropEvidence(store, event({ ...common, id: 'request-2', type: 'INFERENCE_REQUESTED' }));
  assert.throws(() => appendAirdropEvidence(store, event({ ...common, id: 'final-2', type: 'SPEND_FINALIZED', finalized_block: '123' })), /WITHOUT_VERIFIED_SETTLEMENT/);
  assert.equal(store.verify(), true);
});

test('private material and raw account addresses are rejected from the public evidence ledger', () => {
  const store = ledger();
  assert.throws(() => appendAirdropEvidence(store, event({ seed_phrase: 'never-store-this' })), /SECRET_FIELD_FORBIDDEN/);
  assert.throws(() => appendAirdropEvidence(store, event({ account_address: 'public-address' })), /STORE_ACCOUNT_HASH_NOT_ADDRESS/);
  assert.equal(store.read().length, 0);
});

test('operation cannot cross network, account, DID or mock boundary after restart', () => {
  const store = ledger();
  const request = event({ id: 'bound-request', type: 'INFERENCE_REQUESTED', operation_id: 'bound-op', request_hash: 'c'.repeat(64), idempotency_key: 'd'.repeat(64), account_hash: 'e'.repeat(64), did: 'did:example:fixture', mock: true });
  appendAirdropEvidence(store, request);
  const restarted = new AutonomousEvidenceLedger(store.path);
  for (const change of [{ network: 'DEVNET' }, { account_hash: 'f'.repeat(64) }, { did: 'did:example:other' }, { mock: false }]) {
    assert.throws(() => appendAirdropEvidence(restarted, { ...request, id: 'different-context', type: 'INFERENCE_SETTLED', ...change }), /CONTEXT_CONFLICT/);
  }
  assert.equal(restarted.read().length, 1);
});

test('a settlement event cannot carry failed or unknown settlement state', () => {
  for (const type of ['INFERENCE_SETTLED', 'SPEND_FINALIZED']) assert.throws(() => appendAirdropEvidence(ledger(), event({ type, operation_id: 'x', request_hash: 'c'.repeat(64), idempotency_key: 'd'.repeat(64), settlement_state: 'UNKNOWN_COMMIT_STATE', finalized_block: '123' })), /STATE_CONFLICT/);
});
