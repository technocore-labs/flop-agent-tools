const COMPONENTS = Object.freeze(['JS_CLIENT', 'SDK', 'CLI', 'PYTHON_SDK']);
const HASH = /^[a-f0-9]{64}$/u;

// Explicit allowlists only: an advertised min/max envelope does not qualify
// missing or newer runtime versions. This check never grants signing authority.
export function reviewSdkRuntimeCompatibility({ specVersion, transactionVersion, supportedSpecVersions, supportedTransactionVersions } = {}) {
  const base = { executable: false, installation_performed: false, signing_authorized: false };
  const version = n => Number.isSafeInteger(n) && n >= 0;
  const list = xs => Array.isArray(xs) && xs.length > 0 && xs.every(version);
  if (!version(specVersion) || !list(supportedSpecVersions)) return { ...base, status: 'UNKNOWN', reason: 'EXPLICIT_RUNTIME_AND_TRANSACTION_SUPPORT_REQUIRED' };
  if (!supportedSpecVersions.includes(specVersion)) return { ...base, status: 'BLOCKED', reason: 'RUNTIME_NOT_QUALIFIED', specVersion };
  if (!version(transactionVersion) || !list(supportedTransactionVersions)) return { ...base, status: 'UNKNOWN', reason: 'EXPLICIT_RUNTIME_AND_TRANSACTION_SUPPORT_REQUIRED' };
  if (!supportedTransactionVersions.includes(transactionVersion)) return { ...base, status: 'BLOCKED', reason: 'TRANSACTION_VERSION_NOT_QUALIFIED', transactionVersion };
  return { ...base, status: 'STATIC_VERSION_MATCH_NOT_LIVE_QUALIFICATION', specVersion, transactionVersion };
}

// Registry entries start unknown. Source code or a dependency lockfile alone
// does not prove that a release is official or safe to install.
export function createSdkCompatibilityRegistry(entries = []) {
  const byComponent = new Map();
  for (const entry of entries) {
    if (!COMPONENTS.includes(entry.component) || byComponent.has(entry.component)) throw new Error('INVALID_OR_DUPLICATE_SDK_COMPONENT');
    const verified = entry.verification_status === 'VERIFIED' && entry.authority === 'OFFICIAL' &&
      typeof entry.package === 'string' && typeof entry.version === 'string' &&
      typeof entry.source_url === 'string' && entry.source_url.startsWith('https://') &&
      HASH.test(entry.source_hash ?? '') && HASH.test(entry.package_integrity ?? '') &&
      HASH.test(entry.dependency_tree_hash ?? '') && entry.static_review?.status === 'PASS' &&
      entry.static_review?.network_defaults === 'PASS' &&
      entry.static_review?.signing_behavior === 'PASS' &&
      entry.static_review?.retry_behavior === 'PASS' &&
      entry.static_review?.install_scripts === 'PASS';
    byComponent.set(entry.component, Object.freeze({
      component: entry.component,
      status: verified ? 'VERIFIED' : 'UNKNOWN',
      package: verified ? entry.package : null,
      version: verified ? entry.version : null,
      runtime_requirement: verified ? entry.runtime_requirement ?? 'UNKNOWN' : 'UNKNOWN',
      network_support: verified ? entry.network_support ?? 'UNKNOWN' : 'UNKNOWN',
      known_issues: verified ? entry.known_issues ?? [] : [],
      release_date: verified ? entry.release_date ?? null : null,
      source_commit: verified ? entry.source_commit ?? null : null,
      source_url: verified ? entry.source_url : null,
      source_hash: verified ? entry.source_hash : null,
      dependency_tree_hash: verified ? entry.dependency_tree_hash : null,
      package_integrity: verified ? entry.package_integrity : null,
      static_review: verified ? Object.freeze({ ...entry.static_review }) : null,
      upgrade_candidate: verified,
      installation_performed: false
    }));
  }
  return Object.freeze(COMPONENTS.map(component => byComponent.get(component) ?? Object.freeze({
    component, status: 'UNKNOWN', package: null, version: null, runtime_requirement: 'UNKNOWN',
    network_support: 'UNKNOWN', known_issues: [], release_date: null, source_commit: null,
    source_url: null, source_hash: null, dependency_tree_hash: null, package_integrity: null,
    static_review: null, upgrade_candidate: false, installation_performed: false
  })));
}

// Ambiguous requests are always read back before any retry decision. This
// helper never submits or retries an operation.
export function evaluateInferenceRetry({ settlement_state = 'UNKNOWN_COMMIT_STATE', operation_id_present = false, finalized = false, retryable_failure_final = false } = {}) {
  if (settlement_state === 'UNKNOWN_COMMIT_STATE' || !operation_id_present) return Object.freeze({ action: 'READ_SETTLEMENT_STATE', retry: false, reason: 'NO_BLIND_RETRY' });
  if (settlement_state === 'SETTLED' || finalized) return Object.freeze({ action: 'DO_NOT_RETRY', retry: false, reason: 'OPERATION_ALREADY_COMMITTED' });
  if (settlement_state === 'FAILED_FINAL' && retryable_failure_final) return Object.freeze({ action: 'REVIEW_NEW_OPERATION', retry: false, reason: 'NEW_IDEMPOTENCY_KEY_REQUIRED' });
  return Object.freeze({ action: 'READ_SETTLEMENT_STATE', retry: false, reason: 'SETTLEMENT_NOT_CONFIRMED' });
}

export const SDK_COMPONENTS = COMPONENTS;
