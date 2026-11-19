import { evaluateLaunchSchedule } from './launch_watch.js';
const NETWORK_STATES = Object.freeze(['UNANNOUNCED', 'PLANNED', 'ANNOUNCED', 'BOOTSTRAPPING', 'LIVE', 'DEGRADED', 'PAUSED', 'ENDED']);
const PARTICIPATION_STATES = Object.freeze(['NOT_READY', 'READ_ONLY_READY', 'SIGNER_READY', 'WALLET_READY', 'FAUCET_READY', 'INFERENCE_READY', 'SETTLEMENT_READY', 'AIRDROP_EVIDENCE_READY', 'READY_FOR_HUMAN_APPROVAL']);

// A public page or faucet URL is not activation proof. These fields deliberately
// require both official, hash-backed documentation and observed network identity.
export const ACTIVATION_REQUIREMENTS = Object.freeze([
  'network_id', 'genesis_hash', 'rpc_endpoint', 'explorer', 'faucet',
  'sdk_compatibility', 'participation_docs', 'rpc_observed', 'genesis_observed'
]);

const OFFICIAL_HOSTS = new Set(['flop.finance', 'docs.flop.network', 'api.flop.network', 'mcp.flop.network', 'faucet.flop.network', 'rpc.devnet.flop.network', 'github.com']);

function isOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && OFFICIAL_HOSTS.has(url.hostname.toLowerCase());
  } catch { return false; }
}

function verifiedOfficialEvidence(evidence) {
  return Boolean(evidence && evidence.verification_status === 'VERIFIED' && evidence.authority === 'OFFICIAL' &&
    typeof evidence.value === 'string' && evidence.value.trim() && isOfficialUrl(evidence.source_url) &&
    evidence.freshness_status === 'CURRENT' && /^[a-f0-9]{64}$/u.test(evidence.content_hash ?? '') && Number.isFinite(Date.parse(evidence.observed_at ?? '')));
}

function verifiedOperationEvidence(evidence, expectedType) {
  return Boolean(evidence && evidence.type === expectedType && evidence.verification_status === 'VERIFIED' && evidence.mock !== true &&
    /^[a-f0-9]{64}$/u.test(evidence.evidence_hash ?? '') && typeof evidence.reference === 'string' && evidence.reference.length > 0);
}

function normalizeAnnouncedState(announcement) {
  if (!verifiedOfficialEvidence(announcement)) return 'UNANNOUNCED';
  return ['PLANNED', 'ANNOUNCED', 'BOOTSTRAPPING', 'DEGRADED', 'PAUSED', 'ENDED'].includes(announcement.value) ? announcement.value : 'UNANNOUNCED';
}

export function evaluateTestnetActivation({ announcement = null, evidence = {}, launchSignal = null, observedAt = new Date().toISOString() } = {}) {
  if (!Number.isFinite(Date.parse(observedAt))) throw new Error('INVALID_OBSERVATION_TIME');
  const announcedState = normalizeAnnouncedState(announcement);
  const verified = Object.fromEntries(ACTIVATION_REQUIREMENTS.map(key => [key, verifiedOfficialEvidence(evidence[key])]));
  const missing = ACTIVATION_REQUIREMENTS.filter(key => !verified[key]);
  const proof = {
    status: missing.length ? 'INCOMPLETE' : 'PASS',
    verified_at: observedAt,
    evidence_refs: Object.fromEntries(ACTIVATION_REQUIREMENTS.filter(key => verified[key]).map(key => [key, { source_url: evidence[key].source_url, content_hash: evidence[key].content_hash, observed_at: evidence[key].observed_at }])),
    missing
  };
  // The announcement alone never sets LIVE. A complete proof must include
  // observed RPC and genesis identity, not merely a faucet or a timeline post.
  const explicitlyNotLive = ['DEGRADED', 'PAUSED', 'ENDED'].includes(announcedState);
  const status = proof.status === 'PASS' && !explicitlyNotLive ? 'LIVE' : announcedState;
  return Object.freeze({ network: 'TESTNET', status, activation_proof: proof, launch_schedule: evaluateLaunchSchedule({ signal: launchSignal, networkStatus: status }), faucet_is_activation_proof: false, external_write: false });
}

export function evaluateParticipationReadiness({ networkStatus, readOnlyChecks = {}, signerStatus = 'UNKNOWN', walletEvidence = null, faucetEvidence = null, inferenceEvidence = null, settlementEvidence = null, airdropEvidence = null } = {}) {
  const readOnlyReady = networkStatus?.status === 'LIVE' && networkStatus?.activation_proof?.status === 'PASS' && Object.values(readOnlyChecks).length > 0 && Object.values(readOnlyChecks).every(value => value === 'PASS');
  let state = 'NOT_READY';
  if (readOnlyReady) state = 'READ_ONLY_READY';
  if (readOnlyReady && signerStatus === 'OFFLINE_READY') state = 'SIGNER_READY';
  if (state === 'SIGNER_READY' && verifiedOperationEvidence(walletEvidence, 'ACCOUNT_BOUND')) state = 'WALLET_READY';
  if (state === 'WALLET_READY' && verifiedOperationEvidence(faucetEvidence, 'FAUCET_RECEIVED')) state = 'FAUCET_READY';
  if (state === 'FAUCET_READY' && verifiedOperationEvidence(inferenceEvidence, 'INFERENCE_SETTLED')) state = 'INFERENCE_READY';
  if (state === 'INFERENCE_READY' && verifiedOperationEvidence(settlementEvidence, 'SPEND_FINALIZED')) state = 'SETTLEMENT_READY';
  if (state === 'SETTLEMENT_READY' && verifiedOperationEvidence(airdropEvidence, 'ALLOCATION_PUBLISHED')) state = 'AIRDROP_EVIDENCE_READY';
  if (state === 'AIRDROP_EVIDENCE_READY') state = 'READY_FOR_HUMAN_APPROVAL';
  if (!PARTICIPATION_STATES.includes(state)) throw new Error('INVALID_PARTICIPATION_STATE');
  return Object.freeze({ status: state, executable: false, human_approval_required: true, airdrop_eligibility: 'UNKNOWN', allocation_amount: 'UNKNOWN', claimability: 'UNKNOWN', external_write: false });
}
