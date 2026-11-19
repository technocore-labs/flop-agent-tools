const HASH = /^[a-f0-9]{64}$/u;
const SENSITIVE_SIGNALS = new Set(['WALLET_DRAIN_REQUEST', 'PRIVATE_KEY_REQUEST', 'PAYMENT_BEFORE_CLAIM', 'UNSIGNED_CONTRACT']);
const OFFICIAL_SOURCE_HOSTS = new Set(['docs.flop.network', 'flop.finance', 'github.com']);

function parseHttps(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return url;
  } catch { return null; }
}

function verifiedOfficialEvidence(evidence) {
  const url = parseHttps(evidence?.source_url ?? '');
  return Boolean(url && OFFICIAL_SOURCE_HOSTS.has(url.hostname.toLowerCase()) && evidence.authority === 'OFFICIAL' && evidence.verification_status === 'VERIFIED' &&
    evidence.freshness_status === 'CURRENT' && HASH.test(evidence.content_hash ?? '') &&
    Number.isFinite(Date.parse(evidence.observed_at ?? '')));
}

function sameCanonicalUrl(candidate, canonical) {
  const a = parseHttps(candidate); const b = parseHttps(canonical);
  return Boolean(a && b && a.href.toLowerCase() === b.href.toLowerCase());
}

export function evaluateOfficialAssetCandidate({
  kind, candidate_url, canonical_url, canonical_registry_evidence = null, redirect_chain = [], announcement_evidence = null,
  contract_evidence = null, network_evidence = null, signals = []
} = {}) {
  const reasons = [];
  const candidate = parseHttps(candidate_url ?? '');
  const canonical = parseHttps(canonical_url ?? '');
  const registryUrl = verifiedOfficialEvidence(canonical_registry_evidence) ? parseHttps(canonical_registry_evidence.value) : null;
  if (!['TOKEN_CONTRACT', 'CLAIM_SITE', 'FAUCET', 'EXPLORER', 'RPC'].includes(kind)) reasons.push('UNKNOWN_ASSET_KIND');
  if (!candidate || !canonical) reasons.push('INVALID_OR_NON_HTTPS_URL');
  if (!registryUrl || !sameCanonicalUrl(registryUrl.href, canonical?.href ?? '')) reasons.push('CANONICAL_REGISTRY_UNVERIFIED');
  if (candidate && canonical && (!sameCanonicalUrl(candidate.href, canonical.href) || !sameCanonicalUrl(candidate.href, registryUrl?.href ?? ''))) reasons.push('CANONICAL_URL_MISMATCH');
  const chain = Array.isArray(redirect_chain) ? redirect_chain : [];
  for (const target of chain) if (!candidate || !sameCanonicalUrl(target, canonical?.href)) reasons.push('REDIRECT_DOMAIN_MISMATCH');
  if (!verifiedOfficialEvidence(announcement_evidence)) reasons.push('OFFICIAL_ANNOUNCEMENT_UNVERIFIED');
  if (kind === 'CLAIM_SITE' || kind === 'TOKEN_CONTRACT') {
    if (!verifiedOfficialEvidence(contract_evidence)) reasons.push('CONTRACT_IDENTITY_UNVERIFIED');
    if (!verifiedOfficialEvidence(network_evidence)) reasons.push('NETWORK_IDENTITY_UNVERIFIED');
    if (contract_evidence?.network_id !== network_evidence?.value) reasons.push('CONTRACT_NETWORK_MISMATCH');
  }
  const detected = [...new Set(signals.filter(signal => SENSITIVE_SIGNALS.has(signal)))];
  if (detected.length) reasons.push(...detected);
  const blocked = reasons.length > 0;
  return Object.freeze({
    kind: kind ?? 'UNKNOWN', candidate_url: candidate?.href ?? null,
    canonical_url: canonical?.href ?? null,
    status: blocked ? 'BLOCKED_UNVERIFIED' : 'VERIFIED_CANDIDATE',
    official_token_contract: kind === 'TOKEN_CONTRACT' && !blocked ? 'VERIFIED' : 'UNKNOWN',
    reasons: Object.freeze([...new Set(reasons)]), wallet_interaction_allowed: false,
    claim_allowed: false, external_write: false
  });
}

export function classifyClaimUrl(input) {
  const result = evaluateOfficialAssetCandidate({ ...input, kind: 'CLAIM_SITE' });
  return Object.freeze({ ...result, status: result.status === 'VERIFIED_CANDIDATE' ? 'READY_FOR_HUMAN_REVIEW' : 'BLOCKED_UNVERIFIED', claim_allowed: false });
}
