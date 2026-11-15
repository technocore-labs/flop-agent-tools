#!/usr/bin/env node
// Standalone offline verifier. Uses only Node built-ins and the supplied bundle.
import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const sensitivePatterns = [
  /(?:[A-Z]:\\Users\\|\/Users\/)/iu,
  /-----BEGIN [^-]*PRIVATE KEY-----/iu,
  /\b(?:api[_-]?key|bearer|webhook[_-]?secret|seed)\s*[:=]/iu,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /\+?\d[\d ()-]{9,}\d/u
];
const cryptographicFields = new Set(['from', 'sig', 'signature', 'nonce', 'seq', 'ts', 'timestamp', 'generation', 'version', 'signature_hash', 'record_hash', 'public_key']);
export function privacySafeRecord(rawText) {
  let record;
  try { record = JSON.parse(rawText); } catch { return false; }
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  return Object.entries(record).every(([field, value]) => {
    if (typeof value !== 'string' || cryptographicFields.has(field)) return true;
    // Independent implementation of the documented public reference-ID rule.
    const headerChecked = value.replace(/^Contribution report \((20\d{2})-(\d{2})-(\d{2}) \| REF-(20\d{6})-(\d{4})\):/u, (header, y, m, d, compact, counter) => {
      const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
      const valid = date.getUTCFullYear() === Number(y) && date.getUTCMonth() + 1 === Number(m) && date.getUTCDate() === Number(d) && compact === `${y}${m}${d}`;
      return valid ? header.replace(`REF-${compact}-${counter}`, '[PUBLIC_REPORT_REFERENCE]') : header;
    });
    const phoneView = headerChecked.replace(/(?<![A-Za-z0-9_-])REF-(20\d{2})(\d{2})(\d{2})-(\d{2})(\d{2})(?![A-Za-z0-9_-])/gu, (token, y, m, d, h, minute) => {
      const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
      return date.getUTCFullYear() === Number(y) && date.getUTCMonth() + 1 === Number(m) && date.getUTCDate() === Number(d) && Number(h) < 24 && Number(minute) < 60 ? '[PUBLIC_REFERENCE_ID]' : token;
    });
    return sensitivePatterns.every((pattern, index) => !pattern.test(index === sensitivePatterns.length - 1 ? phoneView : value));
  });
}
function keyFromDid(did) {
  if (typeof did !== 'string' || !/^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/u.test(did)) throw Error('invalid DID');
  let number = 0n;
  for (const character of did.slice(9)) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) throw Error('invalid DID alphabet');
    number = number * 58n + BigInt(digit);
  }
  let hex = number.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  const raw = Buffer.from(hex, 'hex');
  if (raw.length !== 34 || raw[0] !== 0xed || raw[1] !== 0x01) throw Error('invalid DID key');
  return createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw.subarray(2)]), format: 'der', type: 'spki' });
}
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function assert(value, message) { if (!value) throw Error(message); }
function listBundleFiles(dir, prefix = '') {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw Error('symbolic links are not allowed');
    if (entry.isDirectory()) {
      assert(name === 'verifier', 'unexpected directory');
      files.push(...listBundleFiles(resolve(dir, entry.name), name));
    } else if (entry.isFile() && name === 'manifest.json') continue;
    else if (entry.isFile()) files.push(name);
    else throw Error('unexpected bundle entry');
  }
  return files.sort();
}
// Independent character scanner; no Node 22 JSON-source feature is required.
function independentIntegerNonce(raw) {
  let i = 0; const keys = new Set(); let nonce = null;
  const space = () => { while (/\s/u.test(raw[i] ?? '') && i < raw.length) i++; };
  const string = () => {
    const start = i++;
    while (i < raw.length) {
      if (raw[i] === '\\') { i += 2; continue; }
      if (raw[i++] === '"') return JSON.parse(raw.slice(start, i));
    }
    throw Error('INVALID_JSON_STRING');
  };
  space(); if (raw[i++] !== '{') throw Error('ROOT_OBJECT_REQUIRED');
  while (i < raw.length) {
    space(); if (raw[i] === '}') break;
    if (raw[i] !== '"') throw Error('ROOT_KEY_REQUIRED');
    const key = string();
    if (keys.has(key)) throw Error('DUPLICATE_ROOT_KEY');
    keys.add(key); space(); if (raw[i++] !== ':') throw Error('COLON_REQUIRED');
    space(); const start = i; let depth = 0;
    while (i < raw.length) {
      const c = raw[i];
      if (c === '"') { string(); continue; }
      if (depth === 0 && (c === ',' || c === '}')) break;
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') depth--;
      i++;
    }
    if (key === 'nonce') {
      const token = raw.slice(start, i).trim();
      if (!/^(?:0|[1-9]\d{0,39})$/u.test(token)) throw Error('UNSUPPORTED_NONCE_TOKEN');
      nonce = token;
    }
    if (raw[i] === ',') i++; else break;
  }
  if (nonce === null) throw Error('ROOT_NONCE_MISSING');
  return nonce;
}
export function classifyRawRecord(raw, verifierVersion = '2') {
  if (!['2', '3'].includes(verifierVersion)) return { result: 'UNSUPPORTED_FORMAT', classification: 'UNSUPPORTED', canonical: null, record: null };
  let record;
  try { record = JSON.parse(raw); } catch { return { result: 'MALFORMED_RECORD', classification: 'INVALID', canonical: null, record: null }; }
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { result: 'MALFORMED_RECORD', classification: 'INVALID', canonical: null, record };
  let canonical = null;
  if (Number.isSafeInteger(record.nonce) && record.nonce >= 0 && typeof record.text === 'string' && !record.text.includes('\n') && !record.text.includes('\r')) canonical = Buffer.from(`technocore|${record.nonce}|${record.text}`, 'utf8');
  let exactNonce = null;
  if (verifierVersion === '3') {
    try { exactNonce = independentIntegerNonce(raw); }
    catch (error) { return { result: error.message === 'DUPLICATE_ROOT_KEY' ? 'AMBIGUOUS_CANONICALIZATION' : 'UNSUPPORTED_FORMAT', classification: error.message === 'DUPLICATE_ROOT_KEY' ? 'AMBIGUOUS' : 'UNSUPPORTED', canonical: null, record }; }
    if (typeof record.text === 'string' && !/[\r\n]/u.test(record.text)) canonical = Buffer.from(['technocore', exactNonce, record.text].join('|'), 'utf8');
  }
  if (typeof record.from !== 'string' || !record.from.startsWith('did:key:') || typeof record.sig !== 'string') return { result: 'UNSUPPORTED_FORMAT', classification: 'UNSUPPORTED', canonical, record };
  let key;
  try { key = keyFromDid(record.from); } catch { return { result: 'MISSING_KEY', classification: 'UNSUPPORTED', canonical, record }; }
  if (!/^[A-Za-z0-9_-]{85}[AQgw]$/u.test(record.sig)) return { result: 'UNSUPPORTED_FORMAT', classification: 'UNSUPPORTED', canonical, record };
  if ((verifierVersion === '2' && (!Number.isSafeInteger(record.nonce) || record.nonce < 0)) || typeof record.text !== 'string') return { result: 'UNSUPPORTED_FORMAT', classification: 'UNSUPPORTED', canonical: null, record };
  if (record.text.includes('\n') || record.text.includes('\r')) return { result: 'AMBIGUOUS_CANONICALIZATION', classification: 'AMBIGUOUS', canonical: null, record };
  const signature = Buffer.from(record.sig, 'base64url');
  if (signature.length !== 64 || signature.toString('base64url') !== record.sig) return { result: 'UNSUPPORTED_FORMAT', classification: 'UNSUPPORTED', canonical: null, record };
  const valid = verify(null, canonical, key, signature);
  return { result: valid ? 'VERIFIED' : 'INVALID_SIGNATURE', classification: valid ? 'CURRENT_VERIFIED' : 'INVALID', canonical, record, signature };
}

export function verifyReport(dir) {
  const bundle = resolve(dir);
  const manifest = readJson(resolve(bundle, 'manifest.json'));
  assert(manifest.schema_version === 1 && /^technocore-[0-9TZ-]+$/u.test(manifest.report_id), 'manifest schema/id');
  assert(basename(bundle) === manifest.report_id, 'report directory/id mismatch');
  const fileNames = Object.keys(manifest.files).sort();
  assert(fileNames.join(',') === listBundleFiles(bundle).join(','), 'unexpected/missing file');
  for (const name of fileNames) {
    assert(name === 'README.md' || /^[a-z0-9-]+\.json$/u.test(name) || name === 'verifier/verify-report.js' || name === 'verifier/package.json', 'unsafe filename');
    assert(sha(readFileSync(resolve(bundle, ...name.split('/')))) === manifest.files[name], `file hash: ${name}`);
  }
  const root = sha(Buffer.from(fileNames.map(name => `${name}:${manifest.files[name]}`).join('\n')));
  assert(root === manifest.evidence_root_hash, 'evidence root');
  const report = readJson(resolve(bundle, 'report.json'));
  assert(['2', '3'].includes(report.verifier_version), 'unsupported verifier version');
  const samples = readJson(resolve(bundle, 'samples.json'));
  const claims = readJson(resolve(bundle, 'claims.json'));
  assert(report.report_id === manifest.report_id, 'report linkage');
  const evidenceNames = ['claims.json', 'measurements.json', 'samples.json', 'source-provenance.json', 'verification-results.json'];
  const evidenceHash = sha(Buffer.from(evidenceNames.map(name => `${name}:${manifest.files[name]}`).join('\n')));
  assert(report.evidence_manifest_hash === evidenceHash, 'report evidence linkage');
  assert(samples.method === 'EVENLY_SPACED_ELIGIBLE_INDICES_V1', 'sample method');
  assert(samples.eligible_count === report.signed_records_eligible && samples.indices.length === report.signed_records_sampled, 'sample coverage');
  assert(samples.eligible_records?.length === samples.eligible_count && samples.eligible_line_indices?.length === samples.eligible_count, 'eligible index set');
  assert(samples.eligible_records.every((row, i) => row.eligible_index === i && Number.isSafeInteger(row.export_line_index) && row.export_line_index >= 0 && /^[a-f0-9]{64}$/u.test(row.raw_record_hash) && (i === 0 || row.export_line_index > samples.eligible_records[i - 1].export_line_index)), 'eligible record inventory');
  assert(JSON.stringify(samples.eligible_line_indices) === JSON.stringify(samples.eligible_records.map(row => row.export_line_index)), 'eligible index linkage');
  assert(sha(Buffer.from(samples.eligible_records.map(row => `${row.export_line_index}:${row.raw_record_hash}`).join('\n'))) === samples.sampling_input_hash, 'sampling input hash');
  const eligiblePositions = Array.from({ length: samples.indices.length }, (_, i) => Math.floor(i * (samples.eligible_count - 1) / Math.max(1, samples.indices.length - 1)));
  const expected = eligiblePositions.map(position => samples.eligible_line_indices[position]);
  assert(JSON.stringify(samples.indices) === JSON.stringify(expected), 'sample determinism');
  assert(samples.records.length === samples.indices.length, 'sample count');
  let verified = 0;
  const classifications = { CURRENT_VERIFIED: 0, LEGACY_VERIFIED: 0, AMBIGUOUS: 0, UNSUPPORTED: 0, INVALID: 0 };
  for (let i = 0; i < samples.records.length; i++) {
    const row = samples.records[i];
    assert(row.eligible_index === eligiblePositions[i] && row.export_line_index === samples.indices[i], 'sample index');
    const raw = Buffer.from(row.raw_record_base64 ?? '', 'base64');
    assert(raw.length > 0 && raw.toString('base64') === row.raw_record_base64, 'raw record encoding');
    assert(sha(raw) === row.raw_record_hash && row.record_hash === row.raw_record_hash, 'raw record hash');
    assert(samples.eligible_records[eligiblePositions[i]].raw_record_hash === row.raw_record_hash, 'sample inventory linkage');
    const rawText = raw.toString('utf8');
    assert(Buffer.from(rawText, 'utf8').equals(raw) && privacySafeRecord(rawText), 'raw record utf8/privacy');
    const checked = classifyRawRecord(rawText, report.verifier_version);
    assert(checked.result === row.verifier_result && checked.classification === row.classification, `sample classification at ${i}`);
    assert(row.sequence === (checked.record?.seq ?? null) && row.timestamp === (checked.record?.ts ?? null), 'sample sequence/timestamp linkage');
    assert(row.did === (checked.record?.from ?? null) && row.signature_base64url === (checked.record?.sig ?? null), 'sample identity/signature linkage');
    const fields = checked.record && typeof checked.record === 'object' && !Array.isArray(checked.record) ? Object.fromEntries(Object.entries(checked.record).map(([key, value]) => [key, value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value])) : {};
    assert(JSON.stringify(row.field_names) === JSON.stringify(Object.keys(fields).sort()) && JSON.stringify(row.field_types) === JSON.stringify(fields), 'sample structure');
    if (checked.canonical) {
      const bytes = Buffer.from(row.canonical_bytes_base64 ?? '', 'base64');
      assert(bytes.length > 0 && bytes.toString('base64') === row.canonical_bytes_base64, 'canonical byte encoding');
      assert(bytes.equals(checked.canonical) && sha(bytes) === row.canonical_bytes_hash, 'canonical bytes linkage');
      if (checked.signature) assert(sha(checked.signature) === row.signature_hash, 'signature hash');
      else assert(row.signature_hash === null, 'unexpected signature hash');
      if (row.classification === 'CURRENT_VERIFIED') verified++;
    } else assert(row.canonical_bytes_base64 === null && row.canonical_bytes_hash === null, 'unexpected canonical bytes');
    assert(Object.hasOwn(classifications, row.classification), 'unknown sample classification');
    classifications[row.classification]++;
  }
  assert(report.signature_verified === verified && report.signature_failed === classifications.INVALID, 'verification counts');
  for (const [key, count] of Object.entries(classifications)) assert(report[key] === count, `classification count: ${key}`);
  assert(report.snapshot_id === samples.snapshot_id && report.snapshot_id === readJson(resolve(bundle, 'measurements.json')).snapshot_id && report.snapshot_id === readJson(resolve(bundle, 'verification-results.json')).snapshot_id, 'snapshot linkage');
  const verification = readJson(resolve(bundle, 'verification-results.json'));
  assert(JSON.stringify(verification.classifications) === JSON.stringify(classifications) && verification.sample_results.length === samples.records.length, 'verification result summary');
  assert(claims.every(claim => claim.evidence_refs?.length && claim.verification_method && claim.coverage && claim.limitations), 'claim schema');
  const allowed = new Set([...fileNames, 'manifest.json']);
  for (const claim of claims) for (const ref of claim.evidence_refs) assert(allowed.has(ref), 'claim evidence link');
  assert(claims.some(claim => claim.claim_id === 'sampled-signatures' && claim.coverage.sampled === samples.records.length && claim.coverage.verified === verified && claim.coverage.eligible === samples.eligible_count), 'bounded signature claim');
  assert(manifest.previous_report_hash === null || /^[a-f0-9]{64}$/u.test(manifest.previous_report_hash), 'previous report hash');
  if (manifest.previous_report_hash) {
    assert(/^technocore-[0-9TZ-]+$/u.test(manifest.previous_report_id), 'unsafe previous report id');
    const prior = manifest.files['previous-report-manifest.json'] ? resolve(bundle, 'previous-report-manifest.json') : resolve(bundle, '..', manifest.previous_report_id, 'manifest.json');
    assert(readJson(prior).report_id === manifest.previous_report_id && sha(readFileSync(prior)) === manifest.previous_report_hash, 'report chain');
  }
  if (report.report_type === 'REANALYSIS_OF_RETAINED_CAPTURE') {
    const review = readJson(resolve(bundle, 'reanalysis.json'));
    const previous = readJson(resolve(bundle, 'previous-report-manifest.json'));
    assert(review.method_revision === 'HASH_BOUND_ORIGINAL_SAMPLES_V1', 'reanalysis proof version');
    assert(review.original_manifest_hash === manifest.previous_report_hash && review.original_report_id === previous.report_id, 'reanalysis source manifest');
    const oldSampleBytes = readFileSync(resolve(bundle, 'previous-report-samples.json'));
    const oldReportBytes = readFileSync(resolve(bundle, 'previous-report-report.json'));
    assert(sha(oldSampleBytes) === previous.files['samples.json'] && sha(oldReportBytes) === previous.files['report.json'], 'original sample/report hash');
    const oldSamples = JSON.parse(oldSampleBytes); const oldReport = JSON.parse(oldReportBytes);
    assert(oldReport.snapshot_id === report.snapshot_id && oldReport.observation_time === report.observation_time, 'original capture identity');
    for (const field of ['indices', 'eligible_count', 'eligible_records', 'eligible_line_indices', 'sampling_input_hash']) assert(JSON.stringify(oldSamples[field]) === JSON.stringify(samples[field]), `unchanged original sampling: ${field}`);
    assert(oldSamples.records.length === samples.records.length && review.comparisons.length === samples.records.length, 'original sample count');
    for (let index = 0; index < samples.records.length; index++) {
      const old = oldSamples.records[index], current = samples.records[index], comparison = review.comparisons[index];
      assert(old.raw_record_base64 === current.raw_record_base64 && old.raw_record_hash === current.raw_record_hash, 'original sample bytes');
      assert(comparison.original_classification === old.classification && comparison.v3_classification === current.classification && comparison.raw_record_hash === current.raw_record_hash, 'reanalysis classification comparison');
    }
    for (const name of Object.keys(classifications)) assert(review.original_classifications[name] === oldReport[name] && review.classifications_v3[name] === classifications[name], 'reanalysis count linkage');
  }
  return { valid: true, report_id: manifest.report_id, verified_samples: verified, classifications, coverage: samples.records.length / samples.eligible_count, evidence_root_hash: root, previous_report_hash: manifest.previous_report_hash, self_contained_verifier: manifest.files['verifier/verify-report.js'] === sha(readFileSync(fileURLToPath(import.meta.url))), self_contained_previous_manifest: !manifest.previous_report_hash || Boolean(manifest.files['previous-report-manifest.json']), reproducibility: 'SAMPLED_RECORDS_REPRODUCIBLE' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(verifyReport(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..', 'evidence', 'latest')), null, 2)); }
  catch (error) { console.error(`VERIFY_REPORT_FAIL: ${error.message}`); process.exitCode = 1; }
}
