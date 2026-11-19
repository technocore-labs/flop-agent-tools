import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTestnetActivation } from '../src/testnet/readiness/index.js';
import { evaluateLaunchSchedule, evaluateSdkMigration } from '../src/testnet/readiness/launch_watch.js';

const signal = { announced_date: '2026-11-24', evidence_hash: 'a'.repeat(64), classification: 'SIGNAL_ONLY', primary_verification: 'UNVERIFIED' };
test('reported November 24 date remains a signal even after the date passes', () => {
  for (const observedAt of ['2026-11-14T00:00:00Z', '2026-11-25T00:00:00Z']) {
    const result = evaluateTestnetActivation({ launchSignal: signal, observedAt });
    assert.equal(result.status, 'UNANNOUNCED');
    assert.equal(result.launch_schedule.planning_date, '2026-11-24');
    assert.equal(result.launch_schedule.primary_verification, 'UNVERIFIED');
    assert.equal(result.launch_schedule.activation_authorized, false);
    assert.equal(result.activation_proof.status, 'INCOMPLETE');
  }
});
test('bad calendar dates or missing screenshot provenance cannot become schedule evidence', () => {
  assert.equal(evaluateLaunchSchedule({ signal: { ...signal, announced_date: '2026-02-30' } }).planning_date, null);
  assert.equal(evaluateLaunchSchedule({ signal: { ...signal, evidence_hash: null } }).planning_date, null);
});
const ready = { runtimeVersion: 1014014, approvedCodeHash: '0x' + 'a'.repeat(64), observedCodeHash: '0x' + 'a'.repeat(64), approvedGenesisHash: '0x' + 'b'.repeat(64), observedGenesisHash: '0x' + 'b'.repeat(64), meteringVerified: true, pricingExpired: false, inputTokens: 100, outputTokens: 256, clientWireVersion: '0.2.0' };
test('documented runtime admission requires observed code and genesis and never permits spending', () => {
  const result = evaluateSdkMigration(ready);
  assert.equal(result.status, 'READY_FOR_REVIEW');
  assert.equal(result.spending_authorized, false);
  for (const overrides of [{ runtimeVersion: 1014006 }, { runtimeVersion: 1014015 }, { observedCodeHash: '0x' + 'c'.repeat(64) }, { observedGenesisHash: null }]) {
    assert.equal(evaluateSdkMigration({ ...ready, ...overrides }).status, 'BLOCKED');
  }
});
test('pricing, explicit token split and wire version fail closed on SDK migration', () => {
  for (const overrides of [{ meteringVerified: false }, { pricingExpired: true }, { inputTokens: null }, { outputTokens: -1 }, { clientWireVersion: '0.5.2' }]) {
    const result = evaluateSdkMigration({ ...ready, ...overrides });
    assert.equal(result.status, 'BLOCKED');
    assert.equal(result.retry, false);
  }
});
