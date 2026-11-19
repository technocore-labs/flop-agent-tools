# A-3 読み取り照合・enrollment 実行計画（未実行）

確認: 2026-11-20 JST / 2026-11-19 18:26 UTC。対象は既存SOV Devnet口座。
この文書は登録・署名・送信・資格情報保存を許可しない。A-3bも未承認。

## 判定

**口座全体: なお不明。登録済み／未登録とは確定できない。**
11/18の特定試行は **拒否確定**（503 `wallet_enrollment_unavailable`）。
それは11/17と11/19の無応答試行の結果を解消せず、現在未登録とも意味しない。

| 対象 | 判定 | 根拠・限界 |
|---|---|---|
| 保存済み過去cap応答 | その試行の拒否確定 | A-3aでキーなし・`wallet_enrollment_cap_reached`確認。現在の登録状態ではない |
| 11/17 00:14:09.648 UTC試行 | なお不明 | 応答・Bearer未取得。既存照合依頼を保持 |
| 11/17 22:48:20.277 UTC試行 | なお不明 | 25秒無応答。未処理や失敗とは認定しない |
| 11/18 11:47:20.873 UTC試行 | 拒否確定 | 完全受信503、既存応答hash `b1298b3a0863468979e6e28eb216aebf85775a3e12405a9114003a485d14d6d3` |
| 11/19 02:51:06.722 UTC試行 | なお不明 | 90.412秒でtimeout、HTTP headersなし。sanitized既存記録を再確認 |
| 現在の登録／利用枠 | なお不明 | A-3aの限定探索で有効Bearerなし。認証付き口座照会不可 |

24時間の経過は発行の証明ではなく、実際のexpires_atも未取得。
有効期限が仮に過ぎても「未登録」にはならず、再登録で更新できるとも判断しない。

## 公開・読み取り経路の全照合範囲

一次資料は現在の[OpenAPI](https://api.flop.network/openapi.json)、
[onboarding](https://docs.flop.network/docs/agent-onboarding)、
[integration](https://docs.flop.network/docs/agent-integration)。
公開契約の全pathsを列挙して、登録・鍵関連の読取経路を確認した。未公開admin APIを推測しない。

| 経路 | 今回の確認 | 何が分かるか／分からないか |
|---|---|---|
| GET `/health` | 200、connected、Devnet genesis一致、image 0.1.404 | 一般疎通だけ。個別登録・scopeは示さない |
| GET `/openapi.json` | 200、52,473 bytes、SHA-256 `260cf883c52d8ca34c6f0546fa46493eb04844f90d2230fe779e50ce7d303af2` | `/v1`と`/api/v1`が公式base。口座別匿名status/renewal APIは掲載なし |
| GET `/v1/enroll/wallet/offer?purpose=hermes-tools-v1` | 503 `wallet_enrollment_unavailable` | 契約上challengeもallowanceも作らない能力preview。個別wallet状態ではない |
| GET `/v1/keys/me` | 契約確認のみ。認証付き実行不可 | Bearerがあればscope/quota/expiry。無資格の401は口座未登録の証明にならないため送らない |
| GET `/v1/keys/me/receipts` と `/{request_id}` | 契約確認のみ | 現在credentialの推論receipt。enrollment結果照会ではない |
| GET `/v1/enroll/wallet/challenge` | **実行しない** | GETでもsingle-use challengeを作る。今回の読み取り専用権限外 |
| POST `/enroll/wallet`、POST `/keys/ephemeral`、DELETE `/keys/me` | **実行しない** | 発行・rotation・revoke。照合のためにも送らない |
| 公式GitHub [#294](https://github.com/flop-labs/network/issues/294) | 5コメント、最新6998274990（既存SOV投稿） | 個別発行結果を確定するissuer回答は確認できず |
| 公式docsが参照する [#6](https://github.com/flop-labs/network/issues/6) | 24コメント、全author_association NONE、最新7000761066 | issuer確認済みの同一口座restoration手順は特定できず。他者の自己申告を公式結論にしない |

口座残高・Explorer・DID co-control・catalog・他参加者の成功はGateway登録状態を証明しない。
公開資料の範囲を尽くしたという意味であり、PC全体や発行側の内部台帳を監査したとはしない。
追加問い合わせの投稿・メールは今回未承認で実施していない。

## 将来の実行計画 — ソブの判断後のみ

### 事前判断

1. issuerが過去試行を特定できれば、そのissued/rejected/not-processed/current-validity説明を優先。
   不明のままrotationを選ぶ場合、古いBearer無効化の可能性をソブが明示承認する。
2. 同一wallet・Devnet・署名目的・1回のenrollmentを指定。新規wallet、追加faucet、
   同一DIDへの鍵交換、cap回避をしない。既存attempt markerを削除・上書きしない。
3. v1（purposeなし）とHermes v2は別の要求。toolsを要さない短い実験にv2を自動選択しない。
   v2が必要なら公開offerを確認するが、今回の503はその経路がreadyという証拠ではない。
4. 現行ローカルUIは署名ボタンからPOSTへ直結し、responseをsecretファイルへ丸ごと保存する。
   **今回の禁止に適合せず起動しない。** 将来も署名プレビューと送信を明確に分離し、
   credentialは非表示・非ログ・メモリのみで扱うか、別途承認されたsecret保管方式を先にレビュー。
   現行helperのhistorical authorization文字列は新たな承認の代わりにならない。

### 要求形式とPC内の署名

将来の承認後だけ、公式GET challengeにaddressを指定し、v2時のみpurposeを付ける。
戻るmessage/nonce/expires_atを期限内（最大5分）に検証する。
`reviewEnrollmentChallenge`はSS58 checksum/prefix42、公式origin、Devnet genesis、
行順、nonce、時刻、正確なUTF-8 bytesを検査する。メッセージを整形・翻訳しない。
v1は8行、v2は署名されるPurpose行を加えた9行。statementが意図しない場合は停止。

Talismanで既存対象口座を選択し、レビューしたUTF-8 messageをhexにし、
`signer.signRaw({address,data,type:'bytes'})`でユーザー本人が承認する計画。
seed・秘密鍵のエクスポートやSignerサービス変更は不要。ローカル検証は既存
`checkWalletSignature`（sr25519/ed25519、raw/Bytes wrapper対応）を使用する。
これはDID公式登録や資金移動の承認ではない。今回は署名自体も実施していない。

将来の送信bodyは `{"address":"<same wallet>","message":"<exact statement>","signature":"<signature>"}`。
Content-Type application/json、POST `https://api.flop.network/v1/enroll/wallet`、4 KB以下。
purposeは追加JSON項目で改変せず署名statementから決まる。redirect禁止、timeoutと応答上限を設定。
transport前に耐久的な専用attempt markerを確保し、自動retryなしで1回だけ。
署名済みstatement、signature、nonce、Bearerを一般ログ・Gitへ入れない。

### 結果ごとの停止と証拠

| 結果 | 判定・次手 |
|---|---|
| 201 + 正しいschema | 新規allowance応答。まだ利用可能とは未認定。秘密値なしでscope/expiry/quotaを認証GET照合 |
| 200 + 正しいschema | 既存Bearer rotation。spend/期限は更新されない。古いキーへの影響を照合 |
| 400/401/409/413 | 形式・署名/genesis・challenge・sizeの拒否を区別。新challenge作成も別実行判断 |
| 402 exhausted / 403 expired,revoke,unfunded | 権限・残高条件を区別。自動faucet・別wallet・再発行禁止 |
| 429 | rate limit。Retry-Afterがあれば保持するが自動再送しない |
| 503 cap / credit-cap | 人数枠とrolling信用枠を区別。正確な空き時刻は不明 |
| 503 unavailable | その応答のサービス拒否。過去UNKNOWNを未登録に変更しない |
| timeout / body不正 / 保存障害 | UNKNOWN_COMMIT_STATE。markerを保持しissuer照合へ |

残す証拠は承認参照、UTC dispatch/受信時刻、固定endpoint、client version、
非秘密のrequest intent hash（signature/credentialを除く）、phase、HTTP、allowlist error、
marker保持とclassification。credentialを含む応答本文のhashやraw bodyも一般証拠へ出さない。
認証情報の安全な存在確認と有効性確認が済んでも、推論は別途A-3b承認待ち。

## 今回のチェックポイント

新規enrollment/challenge/署名/推論/faucet/rotationは0。公開GETのみ。
UNKNOWNのfenceはすべて保持。登録状態の確定はissuer照合または既存credentialの
安全な認証付き読取が必要であり、現在のreadonly範囲では越えられない停止条件として記録する。
