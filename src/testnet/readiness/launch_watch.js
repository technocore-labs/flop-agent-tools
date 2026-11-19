// Timeline signals never supply network activation or permission to spend.
export function evaluateLaunchSchedule({ signal = null, networkStatus = 'UNKNOWN' } = {}) {
  const date = signal?.announced_date;
  const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(date) ? new Date(`${date}T00:00:00Z`) : null;
  const valid = parsed && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date &&
    /^[a-f0-9]{64}$/u.test(signal.evidence_hash ?? '') && signal.classification === 'SIGNAL_ONLY';
  return Object.freeze({ planning_date: valid ? date : null, timezone: 'UNKNOWN', date_status: valid ? 'REPORTED_START_DATE' : 'UNKNOWN', primary_verification: valid ? signal.primary_verification ?? 'UNVERIFIED' : 'UNVERIFIED', authority: 'SIGNAL_ONLY', network_status: networkStatus, activation_authorized: false, claim_open: 'UNKNOWN', external_write: false });
}

// Exact client admission list in the official 2026-11-11 upgrade guide.
export const SDK_0_5_2_RUNTIME_VERSIONS = Object.freeze([
  1013000, 1014000, 1014001, 1014002, 1014003, 1014004, 1014005,
  1014007, 1014008, 1014009, 1014010, 1014011, 1014012, 1014013, 1014014
]);
export function evaluateSdkMigration({ runtimeVersion = null, approvedCodeHash = null, observedCodeHash = null, approvedGenesisHash = null, observedGenesisHash = null, meteringVerified = false, pricingExpired = true, inputTokens = null, outputTokens = null, clientWireVersion = '0.2.0' } = {}) {
  const hash = value => /^0x[a-f0-9]{64}$/u.test(value ?? '');
  const checks = {
    runtime_admitted: Number.isSafeInteger(runtimeVersion) && SDK_0_5_2_RUNTIME_VERSIONS.includes(runtimeVersion),
    code_identity: hash(approvedCodeHash) && approvedCodeHash === observedCodeHash,
    genesis_identity: hash(approvedGenesisHash) && approvedGenesisHash === observedGenesisHash,
    metering: meteringVerified === true && pricingExpired === false,
    token_split: Number.isSafeInteger(inputTokens) && inputTokens >= 0 && Number.isSafeInteger(outputTokens) && outputTokens >= 0,
    wire_version: clientWireVersion === '0.2.0'
  };
  return Object.freeze({ status: Object.values(checks).every(Boolean) ? 'READY_FOR_REVIEW' : 'BLOCKED', checks, client_wire_version: '0.2.0', spending_authorized: false, retry: false, installation_performed: false });
}
