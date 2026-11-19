// Local interpretation only: no enrollment, credential handling or automatic retries.
export function diagnoseEnrollment({ errorCode = null, walletFunded = false, allowance = null, now = Date.now(), model = null } = {}) {
  const base = { faucet_funding_proves_access: false, wallet_funded: walletFunded === true, retry: false, rotate_wallet: false, external_write: false, inference_authorized: false };
  if (errorCode === 'wallet_enrollment_cap_reached') return { ...base, status: 'SHARED_ENROLLMENT_CAP', action: 'WAIT_SAME_WALLET_FRESH_CHALLENGE_IF_EXPIRED', reset: 'ROLLING_24H_NOT_MIDNIGHT' };
  if (errorCode === 'wallet_enrollment_unavailable') return { ...base, status: 'ISSUER_SERVICE_FAILURE', action: 'RECORD_ERROR_AND_WAIT', reset: 'UNKNOWN' };
  if (errorCode) return { ...base, status: 'UNKNOWN_ERROR', action: 'INSPECT_SANITIZED_RESPONSE' };
  if (!allowance) return { ...base, status: 'ALLOWANCE_NOT_VERIFIED', action: 'READ_AUTHENTICATED_ALLOWANCE_WITH_EXISTING_CREDENTIAL' };
  if (!Number.isSafeInteger(allowance.expires_at) || !Number.isFinite(now)) return { ...base, status: 'ALLOWANCE_SCHEMA_UNKNOWN', action: 'DO_NOT_SUBMIT' };
  if (allowance.expires_at <= now) return { ...base, status: 'ALLOWANCE_EXPIRED', action: 'ISSUER_RENEWAL_REQUIRED_NO_REENROLLMENT_WORKAROUND' };
  // Official keys/me uses a legacy JSON number in FLOP. This checks presence of
  // allowance only; never convert that floating value into exact spending authority.
  const quota = allowance.remaining_quota;
  const numeric = typeof quota === 'number' && Number.isFinite(quota) && quota >= 0;
  const decimal = typeof quota === 'string' && /^\d+(?:\.\d{1,18})?$/u.test(quota);
  if (!numeric && !decimal) return { ...base, status: 'QUOTA_SCHEMA_UNKNOWN', action: 'DO_NOT_SUBMIT' };
  if (numeric ? quota === 0 : !/[1-9]/u.test(quota)) return { ...base, status: 'ALLOWANCE_EXHAUSTED', action: 'ISSUER_RENEWAL_REQUIRED' };
  if (!model || !Array.isArray(allowance.models) || !allowance.models.includes(model)) return { ...base, status: 'MODEL_NOT_AUTHORIZED', action: 'KEEP_CREDENTIAL_SCOPE' };
  return { ...base, status: 'ALLOWANCE_FIELDS_CONSISTENT', action: 'VERIFY_NETWORK_METERING_AND_SIGNER_SEPARATELY', quota_unit: 'FLOP', exact_spend_authority: false, response_authenticity: 'NOT_VERIFIED_BY_THIS_PURE_DIAGNOSTIC' };
}
