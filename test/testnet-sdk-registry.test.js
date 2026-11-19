import test from 'node:test';
import assert from 'node:assert/strict';
import { createSdkCompatibilityRegistry, evaluateInferenceRetry, SDK_COMPONENTS } from '../src/testnet/readiness/sdk_registry.js';

const hash = 'a'.repeat(64);
const reviewed = (component = 'SDK') => ({
  component, package: '@flop/sdk', version: '1.2.3', source_url: 'https://github.com/flop-labs/sdk/releases/tag/v1.2.3',
  source_hash: hash, package_integrity: hash, dependency_tree_hash: hash, authority: 'OFFICIAL', verification_status: 'VERIFIED',
  runtime_requirement: 'node >=20', network_support: ['devnet'], release_date: '2026-11-01', source_commit: 'abc123',
  static_review: { status: 'PASS', network_defaults: 'PASS', signing_behavior: 'PASS', retry_behavior: 'PASS', install_scripts: 'PASS' }
});

test('SDK slots stay UNKNOWN without complete official provenance and static package review', () => {
  const [js, sdk, cli, python] = createSdkCompatibilityRegistry();
  assert.deepEqual([js, sdk, cli, python].map(row => row.status), ['UNKNOWN', 'UNKNOWN', 'UNKNOWN', 'UNKNOWN']);
  const [,verifiedSdk] = createSdkCompatibilityRegistry([reviewed()]);
  assert.equal(verifiedSdk.status, 'VERIFIED');
  assert.equal(verifiedSdk.upgrade_candidate, true);
  assert.equal(verifiedSdk.installation_performed, false);
});

test('unverified package metadata cannot become a compatibility or upgrade claim', () => {
  const entry = reviewed();
  entry.verification_status = 'UNVERIFIED';
  const [, sdk] = createSdkCompatibilityRegistry([entry]);
  assert.equal(sdk.status, 'UNKNOWN');
  assert.equal(sdk.package, null);
  assert.equal(sdk.upgrade_candidate, false);
});

test('a summary PASS cannot override a failed or unknown package safety subcheck', () => {
  for (const field of ['network_defaults', 'signing_behavior', 'retry_behavior', 'install_scripts']) {
    for (const status of ['FAIL', 'UNKNOWN']) {
      const entry = reviewed(); entry.static_review[field] = status;
      const sdk = createSdkCompatibilityRegistry([entry]).find(row => row.component === 'SDK');
      assert.equal(sdk.status, 'UNKNOWN');
      assert.equal(sdk.upgrade_candidate, false);
    }
  }
});

test('duplicate and unsupported SDK component entries are rejected', () => {
  assert.throws(() => createSdkCompatibilityRegistry([reviewed(), reviewed()]), /DUPLICATE/u);
  assert.throws(() => createSdkCompatibilityRegistry([{ ...reviewed(), component: 'WALLET' }]), /COMPONENT/u);
  assert.equal(SDK_COMPONENTS.length, 4);
});

test('unknown inference commit state only permits settlement read, never blind retry', () => {
  assert.deepEqual(evaluateInferenceRetry({ settlement_state: 'UNKNOWN_COMMIT_STATE', operation_id_present: true }), { action: 'READ_SETTLEMENT_STATE', retry: false, reason: 'NO_BLIND_RETRY' });
  assert.equal(evaluateInferenceRetry({ settlement_state: 'SETTLED', operation_id_present: true }).retry, false);
  assert.equal(evaluateInferenceRetry({ settlement_state: 'FAILED_FINAL', operation_id_present: true, retryable_failure_final: true }).action, 'REVIEW_NEW_OPERATION');
});
