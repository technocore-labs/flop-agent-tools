import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyClaimUrl, evaluateOfficialAssetCandidate } from '../src/testnet/readiness/asset_claim_gate.js';

const stamp = '2026-11-06T00:00:00.000Z';
const official = (value, source_url = 'https://docs.flop.network/official') => ({ value, source_url, content_hash: 'a'.repeat(64), observed_at: stamp, authority: 'OFFICIAL', verification_status: 'VERIFIED', freshness_status: 'CURRENT' });
const baseline = () => ({ kind: 'CLAIM_SITE', candidate_url: 'https://claim.flop.finance/', canonical_url: 'https://claim.flop.finance/', canonical_registry_evidence: official('https://claim.flop.finance/'), announcement_evidence: official('claim announced'), contract_evidence: { ...official('0xabc', 'https://docs.flop.network/contracts'), network_id: 'flop-mainnet-1' }, network_evidence: official('flop-mainnet-1') });

test('claim URL stays blocked without verified official URL registry, announcement, and contract/network binding', () => {
  const result = classifyClaimUrl({ candidate_url: 'https://claim.flop.finance/', canonical_url: 'https://claim.flop.finance/' });
  assert.equal(result.status, 'BLOCKED_UNVERIFIED');
  assert.ok(result.reasons.includes('CANONICAL_REGISTRY_UNVERIFIED'));
  assert.ok(result.reasons.includes('OFFICIAL_ANNOUNCEMENT_UNVERIFIED'));
  assert.ok(result.reasons.includes('CONTRACT_IDENTITY_UNVERIFIED'));
  assert.equal(result.claim_allowed, false);
});

test('a fully sourced matching candidate is only ready for human review, never auto-claimable', () => {
  const result = classifyClaimUrl(baseline());
  assert.equal(result.status, 'READY_FOR_HUMAN_REVIEW');
  assert.equal(result.wallet_interaction_allowed, false);
  assert.equal(result.claim_allowed, false);
  assert.equal(result.external_write, false);
});

test('domain mismatch and off-domain redirect are blocked', () => {
  const input = baseline();
  input.candidate_url = 'https://claim-flop.finance/start';
  input.redirect_chain = ['https://wallet-drain.example/claim'];
  const result = classifyClaimUrl(input);
  assert.ok(result.reasons.includes('CANONICAL_URL_MISMATCH'));
  assert.ok(result.reasons.includes('REDIRECT_DOMAIN_MISMATCH'));
});

test('Unicode lookalike domains do not match the canonical origin', () => {
  const input = baseline();
  input.candidate_url = 'https://clаim.flop.finance/'; // Cyrillic а
  const result = classifyClaimUrl(input);
  assert.ok(result.reasons.includes('CANONICAL_URL_MISMATCH'));
});

test('suspicious signing, payment, or unsigned-contract signals force block', () => {
  const result = classifyClaimUrl({ ...baseline(), signals: ['PRIVATE_KEY_REQUEST', 'PAYMENT_BEFORE_CLAIM'] });
  assert.equal(result.status, 'BLOCKED_UNVERIFIED');
  assert.ok(result.reasons.includes('PRIVATE_KEY_REQUEST'));
  assert.ok(result.reasons.includes('PAYMENT_BEFORE_CLAIM'));
});

test('stale official evidence and mismatched chain identity are blocked', () => {
  const input = baseline();
  input.network_evidence = { ...input.network_evidence, freshness_status: 'STALE' };
  const result = classifyClaimUrl(input);
  assert.ok(result.reasons.includes('OFFICIAL_ANNOUNCEMENT_UNVERIFIED') === false);
  assert.ok(result.reasons.includes('NETWORK_IDENTITY_UNVERIFIED'));
});

test('untrusted host cannot author an official URL registry entry', () => {
  const input = baseline();
  input.canonical_registry_evidence = official('https://claim.flop.finance/', 'https://flop-finance.example/docs');
  const result = classifyClaimUrl(input);
  assert.ok(result.reasons.includes('CANONICAL_REGISTRY_UNVERIFIED'));
});

test('token contract remains UNKNOWN unless its official proof set is complete', () => {
  const input = baseline();
  const result = evaluateOfficialAssetCandidate({ ...input, kind: 'TOKEN_CONTRACT' });
  assert.equal(result.official_token_contract, 'VERIFIED');
  const blocked = evaluateOfficialAssetCandidate({ kind: 'TOKEN_CONTRACT', candidate_url: 'https://explorer.flop.finance/token', canonical_url: 'https://explorer.flop.finance/' });
  assert.equal(blocked.official_token_contract, 'UNKNOWN');
});

test('non-HTTPS URLs and unsupported kinds fail closed', () => {
  const insecure = classifyClaimUrl({ ...baseline(), candidate_url: 'http://claim.flop.finance/' });
  assert.ok(insecure.reasons.includes('INVALID_OR_NON_HTTPS_URL'));
  const unknown = evaluateOfficialAssetCandidate({ ...baseline(), kind: 'WALLET' });
  assert.ok(unknown.reasons.includes('UNKNOWN_ASSET_KIND'));
});
