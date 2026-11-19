import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVATION_REQUIREMENTS, evaluateParticipationReadiness, evaluateTestnetActivation } from '../src/testnet/readiness/index.js';

const stamp = '2026-11-06T00:00:00.000Z';
const official = (value, url = 'https://docs.flop.network/docs/official-links') => ({ value, source_url: url, content_hash: 'a'.repeat(64), observed_at: stamp, authority: 'OFFICIAL', verification_status: 'VERIFIED', freshness_status: 'CURRENT' });
const activationEvidence = () => Object.fromEntries(ACTIVATION_REQUIREMENTS.map(key => [key, official(key === 'network_id' ? 'flop-testnet-1' : key === 'genesis_hash' ? 'b'.repeat(64) : `${key}-verified`, key === 'rpc_observed' || key === 'genesis_observed' ? 'https://rpc.devnet.flop.network/' : key === 'faucet' ? 'https://faucet.flop.network/' : 'https://docs.flop.network/docs/official-links')]));

test('a faucet URL and dated announcement cannot promote testnet to LIVE', () => {
  const result = evaluateTestnetActivation({ announcement: official('ANNOUNCED'), evidence: { faucet: official('https://faucet.flop.network/', 'https://docs.flop.network/docs/official-links') }, observedAt: stamp });
  assert.equal(result.status, 'ANNOUNCED');
  assert.equal(result.activation_proof.status, 'INCOMPLETE');
  assert.ok(result.activation_proof.missing.includes('genesis_observed'));
  assert.equal(result.faucet_is_activation_proof, false);
  assert.equal(result.external_write, false);
});

test('complete current official and observed network evidence is required for LIVE', () => {
  const result = evaluateTestnetActivation({ announcement: official('ANNOUNCED'), evidence: activationEvidence(), observedAt: stamp });
  assert.equal(result.status, 'LIVE');
  assert.equal(result.activation_proof.status, 'PASS');
  assert.deepEqual(result.activation_proof.missing, []);
});

test('stale, hashless, or unlisted-source evidence fails closed', () => {
  const evidence = activationEvidence();
  evidence.genesis_hash = { ...evidence.genesis_hash, freshness_status: 'STALE' };
  evidence.rpc_observed = { ...evidence.rpc_observed, source_url: 'https://rpc-devnet.flop.network/' };
  evidence.explorer = { ...evidence.explorer, content_hash: null };
  const result = evaluateTestnetActivation({ announcement: official('PLANNED'), evidence, observedAt: stamp });
  assert.equal(result.status, 'PLANNED');
  assert.equal(result.activation_proof.status, 'INCOMPLETE');
  assert.deepEqual(result.activation_proof.missing.sort(), ['explorer', 'genesis_hash', 'rpc_observed'].sort());
});

test('paused or ended official status cannot be overridden by a complete activation bundle', () => {
  const result = evaluateTestnetActivation({ announcement: official('PAUSED'), evidence: activationEvidence(), observedAt: stamp });
  assert.equal(result.status, 'PAUSED');
  assert.equal(result.activation_proof.status, 'PASS');
});

test('participation readiness is sequential, evidence-backed, and never executable', () => {
  const live = evaluateTestnetActivation({ announcement: official('ANNOUNCED'), evidence: activationEvidence(), observedAt: stamp });
  const base = { networkStatus: live, readOnlyChecks: { sdk: 'PASS', api: 'PASS' }, signerStatus: 'OFFLINE_READY' };
  assert.equal(evaluateParticipationReadiness(base).status, 'SIGNER_READY');
  const accountBound = { type: 'ACCOUNT_BOUND', verification_status: 'VERIFIED', evidence_hash: 'c'.repeat(64), reference: 'evidence:account' };
  const faucetReceived = { type: 'FAUCET_RECEIVED', verification_status: 'VERIFIED', evidence_hash: 'd'.repeat(64), reference: 'evidence:faucet' };
  const inferenceSettled = { type: 'INFERENCE_SETTLED', verification_status: 'VERIFIED', evidence_hash: 'e'.repeat(64), reference: 'evidence:inference' };
  const spendFinalized = { type: 'SPEND_FINALIZED', verification_status: 'VERIFIED', evidence_hash: 'f'.repeat(64), reference: 'evidence:settlement' };
  const allocationPublished = { type: 'ALLOCATION_PUBLISHED', verification_status: 'VERIFIED', evidence_hash: '1'.repeat(64), reference: 'evidence:allocation' };
  const ready = evaluateParticipationReadiness({ ...base, walletEvidence: accountBound, faucetEvidence: faucetReceived, inferenceEvidence: inferenceSettled, settlementEvidence: spendFinalized, airdropEvidence: allocationPublished });
  assert.equal(ready.status, 'READY_FOR_HUMAN_APPROVAL');
  assert.equal(ready.executable, false);
  assert.equal(ready.human_approval_required, true);
  assert.equal(ready.airdrop_eligibility, 'UNKNOWN');
  assert.equal(ready.claimability, 'UNKNOWN');
});

test('faucet receipt alone never advances beyond FAUCET_READY or invents allocation', () => {
  const live = evaluateTestnetActivation({ announcement: official('ANNOUNCED'), evidence: activationEvidence(), observedAt: stamp });
  const result = evaluateParticipationReadiness({ networkStatus: live, readOnlyChecks: { docs: 'PASS' }, signerStatus: 'OFFLINE_READY', walletEvidence: { type: 'ACCOUNT_BOUND', verification_status: 'VERIFIED', evidence_hash: 'c'.repeat(64), reference: 'account' }, faucetEvidence: { type: 'FAUCET_RECEIVED', verification_status: 'VERIFIED', evidence_hash: 'd'.repeat(64), reference: 'faucet' } });
  assert.equal(result.status, 'FAUCET_READY');
  assert.equal(result.allocation_amount, 'UNKNOWN');
  assert.equal(result.airdrop_eligibility, 'UNKNOWN');
  assert.equal(result.executable, false);
});
