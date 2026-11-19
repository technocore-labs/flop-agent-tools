# A-6 初稿の机上リハーサル — 2026-11-20 JST

対象: A-6初稿ac08fecと既存readinessコード。送信なし、署名なし、key読取なし。
API/faucet/Explorerの公開GETと公式docs・OpenAPI、既存コードの静的確認、offline/mock検証を使用。

## 手順別チェック

| 初稿段階 | 実在確認した参照・コマンド | 結果と前提条件 |
|---|---|---|
| 開始検知 | [timeline](https://docs.flop.network/docs/testnet-and-timeline)、[Devnet profile](https://docs.flop.network/networks/devnet) | 公式文書は存在。11/24条件付き目標のまま。確定時刻・Testnet genesis未確認。Devnet profileにもverified public genesis/releaseなし |
| chain識別 | GET API `/health`、faucet `/chain`、Explorer `/api/health` | 200、3サービスのDevnet genesis一致。Explorer headLag=1。独立RPCの再確認とは別 |
| RPC | `wss://rpc.devnet.flop.network` へ2つのreadonly methodを計画（block 0 hash、runtime） | 今回の直接WebSocket試行は有効応答を得ずUNKNOWN。protocol結果なしで原因特定や公式障害と断定しない。再試行しない |
| Faucet | GET `https://faucet.flop.network/`、`/chain`、`/limits` | rootは502、chain/limitsは200・stale=false。UI操作可能とは未確認。`/fund`はOpenAPIの説明に実在するがPOSTは未実行 |
| DID/口座 | 公式timelineの同一Technocore DID記載、既存co-control基盤 | 既存DIDと別SS58の公式登録・Testnet署名HTTP契約は未確認。鍵コピーや新規DIDを提案しない |
| 認証 | OpenAPI GET `/v1/keys/me`、A-3aとA-3照合計画 | 経路は実在するがBearerなしでscope判定不可。GET challengeは発行を伴うので未実行 |
| 初回推論 | OpenAPI POST `/v1/chat/completions`、`scripts/execute_one_inference.js` | endpoint契約とファイルは実在。実行権限なし。catalogは200で3modelだが利用権・実応答は未証明 |
| Receipt | OpenAPI GET `/v1/keys/me/receipts/{request_id}`、`scripts/reconcile_one_inference.js` | ID規則と現行コードに差。下記の修正・検証が必要。照会自体は未実行 |
| 停止・台帳 | `runOnce`、`gateway_receipt.js`、readback helperと関連テスト | 耐久attempt fence保持・未知結果保守・mock照合はPASS。実receipt/finality・dashboard反映は未実証 |

## 実在するが今回実行しないコマンド

`node scripts/execute_one_inference.js <credential JSON> <approved plan JSON> <operation dir>`
は送信器であり、previewや読取検査に使わない。引数はstate/private内を要求する。
`node scripts/reconcile_one_inference.js <credential JSON> <expected identity JSON> <original operation dir>`
は原実行のcompletionとcredentialが必要。空のdirectoryや架空IDを作って照合したことにしない。
credentialをコマンドライン値・環境dump・stdoutへ出さない。

Nodeは存在。`flop`コマンドはこのPCのPATHでは見つからず、npx/依存installで補わない。
ローカルのenrollment UIはinternal作業ツリーに存在するが、公開checkpointの汎用CLIではない。
起動すると署名後送信とraw credential保存に進むため今回の手順に含めない。

## 初稿へ反映した食い違い

1. **Testnet実行適合**: `executeOne`はDEVNETと既知genesisを固定。
   公式RESTという経路の実在は確認できるが、現行プログラムのTestnet対応を意味しない。
2. **費用上限**: `prepareOneInference`とrehearsal branchのbodyはmodel/messages/max_tokens/streamのみ。
   OpenAPIの `max_cost_flop` が送信bodyに入らず、コードもtotal_cost_cap_proven=false。
   見積・予算レビューだけでは強制上限にならない。実装と実契約の検証まで停止。
3. **Receipt相関ID**: OpenAPIのpath説明はX-Request-ID優先、次にIdempotency-Key。
   現行completion評価は本文id、再照合はid/request_idを選び、runOnceはheadersを保存しない。
   IDが一致するというネットワーク実証なし。現在の単体テストPASSはこの契約差を否定しない。
   これはコード上の照合準備不足であり、過去に誤決済したという主張ではない。
4. **サービス利用可能性**: API health正常でもoffer503、faucet metadata正常でもUI502。
   一つのhealth結果を全surfaceの稼働や個人口座の許可に拡張しない。
5. **停止の意味**: UNKNOWNを保持して次の開発チケットへ進む。登録・請求・推論の再送には進まない。

上記を本チケットで勝手に送信器へ修正・接続せず、次の実装レビュー候補として残す。

## 検証記録

公開GETは8件（API4、faucet3、Explorer1）。うちoffer503、faucet root502を失敗のまま保持。
別に直接WSS接続を1回試行したが有効RPC応答なし。challenge、認証GET、POST/DELETEは0。
既存docs参照とGitHub issueの読取は別途A-3記録を参照。API OpenAPIは52,473 bytes、
SHA-256 `260cf883c52d8ca34c6f0546fa46493eb04844f90d2230fe779e50ce7d303af2`。
raw公開captureとmetadataは内部に保持し、本書では秘密値や絶対ローカルパスを公開しない。

`node --check`で実行器・照合wrapper・関連4moduleとinternal enrollment UIの計7ファイルを構文確認。
8 test filesのoffline/mockテスト34/34 PASS（launch、one-shot、execute、receipt、reconcile、
enrollment challenge/result/diagnostics）。実署名・enrollment・推論・faucetは実施していない。
実装変更なしの文書修正で、全100件の再実行はしていない。前バッチの全suite証拠と区別する。

**机上リハーサル完了、Devnet実完走は未達。** G1/G2/G3の承認、認証情報、
runtime/費用/ID照合の準備が揃うまで実行不可。30分の目標時計もまだ開始しない。
