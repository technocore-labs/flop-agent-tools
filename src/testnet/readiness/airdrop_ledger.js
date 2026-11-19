import { resolve } from 'node:path';
import { AutonomousEvidenceLedger } from '../../autonomous/evidence_ledger.js';

export const AIRDROP_EVIDENCE_TYPES = Object.freeze([
  'DID_BOUND', 'ACCOUNT_BOUND', 'FAUCET_RECEIVED', 'INFERENCE_REQUESTED', 'INFERENCE_SETTLED',
  'SPEND_FINALIZED', 'SNAPSHOT_OBSERVED', 'ALLOCATION_PUBLISHED', 'UNLOCK_ACTIVITY', 'CLAIMABLE', 'CLAIMED'
]);
const NETWORKS = new Set(['DEVNET', 'TESTNET', 'MAINNET']);
const VERIFICATION = new Set(['VERIFIED', 'UNVERIFIED', 'UNKNOWN', 'CONFLICT']);
const SETTLEMENT = new Set(['NOT_SUBMITTED', 'PENDING', 'UNKNOWN_COMMIT_STATE', 'SETTLED', 'FAILED_FINAL']);
const HASH = /^[a-f0-9]{64}$/u;
const SECRET_FIELD = /(?:private.?key|seed.?phrase|mnemonic|password|bearer|access.?token)/iu;

export function createAirdropEvidence(input) {
  if (!input || !AIRDROP_EVIDENCE_TYPES.includes(input.type)) throw new Error('INVALID_AIRDROP_EVIDENCE_TYPE');
  if (typeof input.id !== 'string' || !input.id || !Number.isFinite(Date.parse(input.timestamp ?? ''))) throw new Error('INVALID_AIRDROP_EVIDENCE_IDENTITY');
  if (!NETWORKS.has(input.network) || !VERIFICATION.has(input.verification_status)) throw new Error('INVALID_AIRDROP_EVIDENCE_CONTEXT');
  if (typeof input.evidence_ref !== 'string' || !input.evidence_ref || !HASH.test(input.evidence_hash ?? '')) throw new Error('AIRDROP_EVIDENCE_REFERENCE_REQUIRED');
  if (input.verification_status === 'VERIFIED' && !HASH.test(input.verifier_evidence_hash ?? '')) throw new Error('VERIFIED_AIRDROP_EVIDENCE_NEEDS_VERIFIER_PROOF');
  if (JSON.stringify(input).split(/[,{]/u).some(part => SECRET_FIELD.test(part.split(':', 1)[0] ?? ''))) throw new Error('SECRET_FIELD_FORBIDDEN');
  if (input.account_address !== undefined) throw new Error('STORE_ACCOUNT_HASH_NOT_ADDRESS');
  if (input.account_hash !== undefined && !HASH.test(input.account_hash)) throw new Error('INVALID_ACCOUNT_HASH');
  if (['INFERENCE_REQUESTED', 'INFERENCE_SETTLED', 'SPEND_FINALIZED'].includes(input.type) && (!input.operation_id || !HASH.test(input.request_hash ?? '') || !HASH.test(input.idempotency_key ?? ''))) throw new Error('INFERENCE_OPERATION_IDENTITY_REQUIRED');
  const settlementState = input.settlement_state ?? (input.type === 'INFERENCE_REQUESTED' ? 'UNKNOWN_COMMIT_STATE' : input.type === 'INFERENCE_SETTLED' ? 'SETTLED' : input.type === 'SPEND_FINALIZED' ? 'SETTLED' : 'NOT_SUBMITTED');
  if (!SETTLEMENT.has(settlementState)) throw new Error('INVALID_SETTLEMENT_STATE');
  if (['INFERENCE_SETTLED', 'SPEND_FINALIZED'].includes(input.type) && settlementState !== 'SETTLED') throw new Error('SETTLEMENT_EVENT_STATE_CONFLICT');
  if (input.type === 'SPEND_FINALIZED' && !input.finalized_block) throw new Error('FINALIZED_SPEND_NEEDS_BLOCK');
  return Object.freeze({
    schema: 'sov.airdrop-evidence.v1', id: input.id, timestamp: input.timestamp, type: input.type, network: input.network,
    did: input.did ?? null, account_hash: input.account_hash ?? null, operation_id: input.operation_id ?? null,
    request_hash: input.request_hash ?? null, idempotency_key: input.idempotency_key ?? null, settlement_state: settlementState,
    tx_hash: input.tx_hash ?? null, finalized_block: input.finalized_block ?? null,
    amount: input.amount ?? null, evidence_ref: input.evidence_ref, evidence_hash: input.evidence_hash,
    verification_status: input.verification_status, verifier_evidence_hash: input.verifier_evidence_hash ?? null,
    source_authority: input.source_authority ?? 'UNKNOWN', mock: input.mock === true, excluded_from_readiness: input.mock === true
  });
}

export function openAirdropEvidenceLedger(root) {
  return new AutonomousEvidenceLedger(resolve(root, 'state/public/airdrop-evidence.jsonl'));
}

export function appendAirdropEvidence(ledger, input) {
  if (!ledger.verify()) throw new Error('AIRDROP_EVIDENCE_CHAIN_INVALID');
  const evidence = createAirdropEvidence(input);
  const records = ledger.read().filter(row => row.type === 'AIRDROP_EVIDENCE');
  const prior = records.find(row => row.data?.id === evidence.id);
  if (prior) {
    if (JSON.stringify(prior.data) !== JSON.stringify(evidence)) throw new Error('AIRDROP_EVIDENCE_IDEMPOTENCY_CONFLICT');
    return { status: 'DUPLICATE', record: prior };
  }
  if (evidence.operation_id) {
    const operation = records.filter(row => row.data?.operation_id === evidence.operation_id).map(row => row.data);
    if (operation.some(row => row.network !== evidence.network || row.did !== evidence.did || row.account_hash !== evidence.account_hash || row.mock !== evidence.mock)) throw new Error('INFERENCE_OPERATION_CONTEXT_CONFLICT');
    if (operation.some(row => row.request_hash !== evidence.request_hash || row.idempotency_key !== evidence.idempotency_key)) throw new Error('INFERENCE_OPERATION_IDEMPOTENCY_CONFLICT');
    if (evidence.type === 'INFERENCE_REQUESTED' && operation.some(row => row.type === 'INFERENCE_REQUESTED')) return { status: 'DUPLICATE_OPERATION', record: operation.find(row => row.type === 'INFERENCE_REQUESTED') };
    if (evidence.type === 'INFERENCE_SETTLED' && !operation.some(row => row.type === 'INFERENCE_REQUESTED')) throw new Error('SETTLEMENT_WITHOUT_RECORDED_REQUEST');
    if (evidence.type === 'SPEND_FINALIZED' && !operation.some(row => row.type === 'INFERENCE_SETTLED' && row.verification_status === 'VERIFIED')) throw new Error('FINALITY_WITHOUT_VERIFIED_SETTLEMENT');
  }
  return { status: 'APPENDED', record: ledger.append('AIRDROP_EVIDENCE', evidence, evidence.timestamp) };
}

export function summarizeAirdropEvidence(ledger) {
  if (!ledger.verify()) throw new Error('AIRDROP_EVIDENCE_CHAIN_INVALID');
  const events = ledger.read().filter(row => row.type === 'AIRDROP_EVIDENCE').map(row => row.data);
  const usable = events.filter(event => event.verification_status === 'VERIFIED' && event.mock !== true && event.excluded_from_readiness !== true);
  const count = type => usable.filter(event => event.type === type).length;
  return Object.freeze({
    chain_valid: true,
    verified_event_counts: Object.fromEntries(AIRDROP_EVIDENCE_TYPES.map(type => [type, count(type)])),
    eligibility: 'UNKNOWN', allocation_score: 'UNKNOWN', allocation_amount: 'UNKNOWN', allocation_snapshot: count('SNAPSHOT_OBSERVED') ? 'OBSERVED' : 'UNKNOWN',
    claimability: count('CLAIMABLE') ? 'EVIDENCE_RECORDED' : 'UNKNOWN', locked_allocation: 'UNKNOWN', unlock_progress: count('UNLOCK_ACTIVITY') ? 'EVIDENCE_RECORDED' : 'UNKNOWN',
    claimed_amount: 'UNKNOWN', spendable_amount: 'UNKNOWN', faucet_receipt_is_allocation: false, computed_score: false
  });
}
