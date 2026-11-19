// Offline interpretation only. Gateway ledger observations never prove chain finality.
const rawAmount = value => typeof value === 'string' && /^(?:0|[1-9][0-9]{0,77})$/u.test(value);
const base = { retry: false, submit_authorized: false, chain_finality: 'NOT_PROVEN', allocation_credit: 'UNKNOWN' };

export function reviewGatewayReceipt({ httpStatus, receipt, expected } = {}) {
  if (httpStatus === 404) return { ...base, status: 'RECEIPT_NOT_FOUND_NOT_PROOF_OF_NO_CHARGE', action: 'PRESERVE_ORIGINAL_REQUEST_ID' };
  if ([401, 403].includes(httpStatus)) return { ...base, status: 'CREDENTIAL_AUTHORITY_REQUIRED', action: 'NO_CREDENTIAL_ROTATION_OR_PAID_RETRY' };
  if (httpStatus !== 200) return { ...base, status: 'READBACK_UNAVAILABLE', action: 'NO_BLIND_RETRY' };
  if (!expected || !['request_id', 'correlation_id', 'model'].every(k => typeof expected[k] === 'string' && expected[k].length > 0 && expected[k].length <= 256 && receipt?.[k] === expected[k])) return { ...base, status: 'RECEIPT_IDENTITY_MISMATCH', action: 'REJECT_RECEIPT' };
  const fields = ['reserved_spend', 'settled_spend', 'settled_spend_raw', 'terminal_event', 'channel_id', 'created_at', 'state', 'response_status'];
  const nullableText = x => x === null || (typeof x === 'string' && x.length > 0 && x.length <= 1024);
  if (!fields.every(k => Object.hasOwn(receipt, k)) || !['reserved', 'estimated', 'settled', 'released'].includes(receipt.state) || !Number.isSafeInteger(receipt.created_at) || receipt.created_at < 0 || !Number.isFinite(receipt.reserved_spend) || receipt.reserved_spend < 0 || !(receipt.settled_spend === null || (Number.isFinite(receipt.settled_spend) && receipt.settled_spend >= 0)) || !(receipt.settled_spend_raw === null || rawAmount(receipt.settled_spend_raw)) || !nullableText(receipt.terminal_event) || !nullableText(receipt.channel_id) || !(receipt.response_status === null || (Number.isInteger(receipt.response_status) && receipt.response_status >= 100 && receipt.response_status <= 599))) return { ...base, status: 'RECEIPT_SCHEMA_UNKNOWN', action: 'RETAIN_SANITIZED_EVIDENCE' };
  const terminal = ['settled', 'released'].includes(receipt.state);
  return { ...base, status: terminal ? 'TERMINAL_GATEWAY_LEDGER_ONLY' : 'UNRESOLVED_GATEWAY_RESERVATION', action: terminal ? 'VERIFY_CHAIN_EVIDENCE_SEPARATELY' : 'READ_SAME_REQUEST_LATER', gateway_state: receipt.state, exact_allocated_spend_raw: receipt.state === 'settled' ? receipt.settled_spend_raw : null, exact_amount_status: receipt.state === 'settled' && receipt.settled_spend_raw !== null ? 'GATEWAY_REPORTED_EXACT_ALLOCATION_NOT_PAYMENT' : 'UNKNOWN', terminal_event: receipt.terminal_event, per_request_payment_hash: 'NOT_ESTABLISHED', cached_http_status_is_settlement_proof: false };
}

export function reviewInferenceBudget({ approvedSpendRaw, quotedSpendRaw, additionalFeesRaw, allowanceRaw, model, allowedModels = [], quoteExpiresAt, now = Date.now() } = {}) {
  const fail = reason => ({ status: 'BLOCKED', reason, executable: false, retry: false });
  if (![approvedSpendRaw, quotedSpendRaw, additionalFeesRaw, allowanceRaw].every(rawAmount)) return fail('EXACT_AMOUNTS_REQUIRED_FEES_MUST_NOT_BE_ASSUMED_ZERO');
  if (!Number.isSafeInteger(now) || !Number.isSafeInteger(quoteExpiresAt) || quoteExpiresAt <= now) return fail('QUOTE_EXPIRED_OR_UNKNOWN');
  if (typeof model !== 'string' || !Array.isArray(allowedModels) || !allowedModels.includes(model)) return fail('MODEL_SCOPE');
  const total = BigInt(quotedSpendRaw) + BigInt(additionalFeesRaw);
  if (total > BigInt(approvedSpendRaw) || total > BigInt(allowanceRaw)) return fail('SPEND_CAP_EXCEEDED');
  return { status: 'LOCAL_BUDGET_CONSISTENT_NOT_EXECUTION_APPROVAL', total_raw: total.toString(), executable: false, retry: false, remaining_gates: ['AUTHENTIC_QUOTE_AND_ALLOWANCE', 'NETWORK_IDENTITY', 'EXPLICIT_EXECUTION_AUTHORIZATION'] };
}
