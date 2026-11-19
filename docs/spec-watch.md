# A-7 読み取り専用仕様ウォッチ（準備版）

既定はoffline。scheduler/daemon/task登録はなく、定期実行は無効。
認証情報・署名・SDK・推論・faucet・enrollmentにはアクセスしない。
外部文書はUNTRUSTED_INPUTとして文字列比較だけを行い、コードや指示として実行しない。

## 使用法

作業ディレクトリはこのリポジトリ。出力はGit外のローカル証拠領域へ置く。
以下のパスは例示の相対パスで、親ディレクトリは事前に用意する。

```sh
# 手動の公開GET。1回最大4要求、各1秒間隔、15秒timeout、各1 MiB上限。
node scripts/spec_watch.js --live --sources yellowpaper,timeline,conversion --output ../watch-evidence/new-capture
# 保存済みの2回を比較。ネットワーク要求0。
node scripts/spec_watch.js --baseline ../watch-evidence/old/captures.json --current ../watch-evidence/new-capture/captures.json --output ../watch-evidence/comparison
```

許可source: yellowpaper、timeline、conversion、onboarding、integration、direct、sdk、official。
全て固定の公式URL。Yellow Paperはmain refを確認し、commit固定URLで本文を取得するため2要求。
docsは1source1要求。1回の組合せが4要求を超えると拒否し、自動retryしない。
既存研究・freshnessの予算・cadenceを使う運用では事前に残枠を確認し、このCLIを別pollingにしない。
CLI単体にはUTC日予算や実行間隔の永続管理はないため、scheduler接続前に別途レビューが必要。

## 証拠と差分

captures.jsonは公開本文とsource URL・時刻・revision・UTF-8復号後本文のhashを保持する。
report.jsonは比較対象全体のhash、source別判定、変更範囲の行番号・行数を保持。
HTTP転送バイト列の署名や独立チェーン証明ではない。本文自体はコンソールに出さない。
出力先は新規ディレクトリ限定で上書きしない。既存baselineを変更せず、自動昇格もしない。
baselineとcaptureの本文hash・サイズ・公式URLを再検証してから比較する。

- CONTENT_CHANGED: 本文hash変更。HTML装飾などでも検出されるため意味的変更とは未認定。
- REVISION_CHANGED_CONTENT_SAME: Paper commitだけ変更。本文同一でもレビュー対象。
- BASELINE_MISSING: 初回または過去取得失敗。変更発生の証明にはしない。
- UNKNOWN: HTTP非200、redirect、timeout、サイズ超過、内容形式不正など。UNCHANGEDにしない。
- UNCHANGED: 今回比較した本文の同一性のみ。未選択sourceや公式仕様全体の最新性を保証しない。

変更・初回はreport内にA-7-REVIEW候補を生成し、A-2/A-6影響確認へ渡す。
チケットはローカル候補でありGitHub Issueを作らない。経済・資格条件を確定しない。
担当者が根拠、旧新差分、実装影響、停止条件を確認し、必要ならソブ判断を待つ。
レビュー済みでもbaselineの採用・置換は別の明示的なローカル操作で行う。
official_sources_current、watermark、autonomous_postingは変更しない。

## 初回記録と限界

2026-11-20 JSTに手動4 GETでPaper/timeline/conversionを取得し、3件BASELINE_MISSINGを記録。
現時点の初回captureであり、昨日から変更なしとは判断しない。
同じcaptureをoffline再比較すると3件UNCHANGED。異なる本文とrevisionの検出は固定fixtureで検証。
検出→ローカルreview候補生成まで実装済み。実際の仕様変更の意味レビュー・運用開始は未実施。
公式docsの残り5件はこの初回取得の対象外。競合集計は今回の準備範囲外。
