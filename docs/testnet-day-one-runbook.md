# A-6 Testnet 初日ランブック — 初稿

作成日: 2026-11-20 JST。状態: DRAFT / NOT EXECUTION AUTHORIZATION。
11/24 は条件付き目標。開始時刻・timezone・Testnet genesis は未確定。
本書は送信手順のレビュー用で、承認や有効な認証情報を代替しない。

## 0. 開始前と目標

最優先は正当な初回 settled session の証拠化。全ゲートが満たされた時点 T0 から
30分以内の初回 settled を運用上の目標とする（公式期限や保証ではない）。
障害待ち・未承認時間は別に記録し、速度のために照合・費用上限を省略しない。
参照: [一次情報一覧](devnet-surfaces.md)、[認可状態](../research-status.json)。
観測は日時・一次URL・取得hash・network identity付きで保存する。秘密値は記録しない。

## 1. 開始検知 — 読み取りのみ

1. 公式 [timeline](https://docs.flop.network/docs/testnet-and-timeline)、
   [official links](https://docs.flop.network/docs/official-links)、公式発表を再確認。
2. 日付到来・HTTP 200・catalog存在だけで開始認定しない。公式Testnet開始宣言と
   公式に公開されたTestnet genesis、RPC/API/Explorer、runtime、chain identityを照合。
3. Devnetの既知genesisと混同しない。複数surfaceが不一致、head停止、更新未確認なら停止。
4. Technocore同一DIDキーの条件と既存SS58口座の公式対応付けを確認する。
   ローカルco-control証明だけで適格としない。新規DID作成・鍵移動は行わない。

承認ポイント G1: ソブが network identity とDID/口座条件をレビュー。
ドラフトの資格・allocation解釈が必要なら人間判断待ち。未確定を埋めない。

## 2. Faucet

公式リンクから該当Testnetのfaucetだけを開き、口座・network・公開上限・cooldownを確認。
Devnetの25 FLOPや上限をTestnetへ転用しない。請求前残高と未確定請求を照合する。
承認ポイント G2: ソブによる今回のfaucet請求の明示承認後に1回だけ実施する。
request/tx IDと残高差・確定状況を記録。timeout/503/Indexer staleならUNKNOWNとして
同じ請求を自動再送しない。faucet残高はGateway利用権・airdrop allocationの証明ではない。

## 3. 認証・scope・費用

秘密値を出さない読み取り専用検査で、公式REST `/v1/keys/me` のscope、許可モデル、
期限、利用枠、network identityを確認。リダイレクト禁止、応答サイズとtimeoutを制限。
A-3aでは既知保存先に有効なBearer未発見、認証有効性・scopeはUNKNOWN。
この状態では先へ進めない。enrollment/rotationは別の状態変更承認が必要で、
結果不明の既存試行を失敗扱いして再送しない。
見積、強制可能な費用上限、1回・1日予算、追加手数料、決済方式を個別確認。
Devnetだけに認めた練習例外をTestnetに転用しない。フィールドの存在は上限強制の証明ではない。

## 4. 初回推論 — 現在は実施禁止

承認ポイント G3 (A-3b): ソブがnetwork、model、短い入力、最大出力、費用上限、
対象口座と1回送信を明示承認して初めて実施可能。無期限・反復承認に解釈しない。
実施時はレビュー済み既存bounded executorを使用し、transport前に耐久attempt markerを
確保して1回送る。idempotency保証のない再送・別model/別経路への自動fallback禁止。
completion本文が届いただけではsettledではない。ID、model、usage、応答hashを記録し、
秘密値・認証header・未審査のprivate responseを記録しない。

## 5. Receipt 照合と台帳

同じrequest IDの公式receiptを読み取り、口座・network・model・費用・状態を厳密照合。
404は非課金の証明ではない。ID不一致、遅延、partial、timeoutはUNKNOWNのまま。
ledger上のterminal表示とchain finalityを分離し、公式方式が要求するtx/block/finalityを確認。
検証済み根拠のある段階だけをsettledとする。receiptと必要なchain証拠のhashを台帳に連結。
台帳・dashboardへ同じ観測状態を反映し、完了していない推論やallocationを成功にしない。
Devnet rehearsalと報酬対象Testnetの記録を分離する。公開は別承認。

## 6. 異常時停止・再開

| 異常 | 状態と対応 | 再開条件 |
|---|---|---|
| genesis/runtime/公式条件不一致 | STOP; 観測を保存 | 公式根拠と人間レビュー |
| 認証なし・期限切れ・403 | BLOCKED; 推論禁止 | 有効なscope確認。更新は別承認 |
| 登録503・cap・transport timeout | 拒否と結果不明を区別、既存fence保持 | issuer照合。再発行/再送の明示承認 |
| POST timeout・5xx・receiptなし | UNKNOWN; attempt marker保持 | 同じIDの読み取り照合、非自動再送 |
| 予算超過・強制上限不明 | STOP; kill switch維持 | 検証済み上限と新たな承認 |
| completion/receipt/費用/口座不一致 | STOP; 二重送信禁止 | 原因説明と証拠の独立確認 |

停止は送信停止を意味し、未確定費用の消去やrollbackではない。未知結果を削除しない。
自律送信・scheduler・autonomous_postingは有効化しない。

## 7. リハーサル記録と受け入れ限界

今回の机上確認: 開始未確認→G1待ち、Bearer不明→認証ゲート停止、G2/G3未承認→送信禁止、
未知結果→fence保持、という分岐を文書レビューした。実ネットワークの完走記録ではない。
マンデートA-6の「Devnetで1回完走」は未達。今回許可は初稿のみで、実送信を禁止している。
次回は別途承認されたDevnet rehearsalで各段階の時刻・ID・費用・照合根拠を埋める。

## 8. 追補（2026-11-22）— 競合観測と直接セッション経路

出典: flop-labs/network の公開 Issue 実読（#399、#501）と、公式 MCP
（mcp.flop.network）・Gateway・Faucet・Explorer への読み取り専用プローブ
（2026-11-22 01:02〜01:10 JST、Muse 実施）。秘密値は含まない。

### 8.1 Gateway 経路の実測（競合も同型の dead end）

- キー TTL は約24時間（#399: 発行翌日に `401 api_key_expired`。#501 も同旨）。
  → enrollment は全準備完了後に取得し、即実行する。T0 直後の取得を前提に組む。
- 失効後の再登録は `403 devnet_enrollment_expired` / `devnet_allowance_exhausted`
  で拒否され、回復経路は現時点で無い（#399、#501、公式回答は未着）。
- 日次 cap 到達は `503 wallet_enrollment_cap_reached`（#399 コメント、RUNECLAW）。
  503／401／403 は原因が別であり、§6 の異常対応でも区別して記録する。
- クォータの文書矛盾: llms.txt は最大 20,000 FLOP/24h、OpenAPI は
  25 FLOP・2 req/min・24h・再登録で更新なし。計画は小さい方に合わせる。
- 供給は時間変動する: #501 は 2026-11-21 に `/v1/models` 空を観測したが、
  2026-11-22 01:02 JST の実測では `qwen/qwen2.5-0.5b-instruct` が掲載され
  capacity も返った。実行直前に models の非空を必須確認とする（§4 の前提に追加）。

### 8.2 直接セッション経路（compute channel）は Devnet で決済実績あり

- 公式 MCP `flop_list_settlements` で `computeChannel.Settled` の実績を確認:
  agent `5HTwHYfivcHQhc9qYXGizxRZVJ9GWBShRZ3dxoCxFKkWq1J8` → miner
  `5D7fTgzoUwc7L9tHt7GSBtE9GNYuP1x8xfMmFQFVwLXp85Tp`、escrow 0.1 FLOP、
  minerPaid 0.085、block 4281989（観測時点 head 4282709）。selfTrade は false
  だが、運営関係者の rehearsal である可能性は排除できない。
- 同 miner の session offer は観測時点で active（settledCount 15）。
  総 HTLC 数は 9,630（indexer stats）。一方 PoI proofs 24h は 0 のままで、
  channel 決済と PoI は別指標として扱う。
- この経路は Gateway Bearer を使わない。ただし SOV 側に channel を開く
  クライアントは未実装で、署名と escrow を伴う状態変更のため、
  実施には経路設計（A-3 の追加チケット）とソブの明示承認が別途必要。
  本追補は経路の存在確認であり、実行許可ではない。
