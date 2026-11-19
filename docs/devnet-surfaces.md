# A-2 公式サーフェスの裏取り — 2026-11-19

対象：公式文書・公式配布情報・公式サービスへの読み取り専用観測。二次記事、他参加者の自己申告、Xの画像は今回の確定根拠に使用していない。取得時刻・レスポンスハッシュは `a2-primary-observations.json` に記録する。実測値は取得時点限りで、利用権・現在の稼働保証・経済条件の確定を意味しない。

## 情報源と格付け

| ID | 一次情報 | 用途・制約 |
| --- | --- | --- |
| P1 | https://docs.flop.network/docs/official-links | 公式ドメイン・アカウント登録簿。公式Xは @flop_labs。新しいX投稿本文は本調査では取得していない |
| P2 | https://docs.flop.network/docs/agent-onboarding | Devnet登録制限、FaucetとGateway枠の分離。開発用文書 |
| P3 | https://docs.flop.network/docs/agent-integration | API利用・クォータ単位・期限・要求の概要。Draft表記 |
| P4 | https://docs.flop.network/docs/send-to-specific-miner | 直接セッション、署名、証拠と回収の手順。Devnet開発用 |
| P5 | https://docs.flop.network/docs/sdk-references | 公式パッケージとMCP。本文のバージョンは古く、同文書もレジストリを優先するとしている |
| P6 | https://docs.flop.network/docs/testnet-and-timeline | 開始目標・Agent初日条件。公開説明と実装の適用範囲は分ける |
| P7 | https://docs.flop.network/docs/airdrop-and-testnet-conversion | 解錠ルールと未実装事項。Draft・genesis未配線の明記あり |
| P8 | https://flop.finance/testnet/ | 参加・Snapshot・公平性。Draft |
| P9 | https://flop.finance/airdrop/ | 配分・解錠。Draft |
| P10 | https://flop.finance/intro/agent/ | セッション要求の概念モデル。Draft |
| P11 | https://github.com/flop-labs/yellowpaper/blob/a5b4326d006c471ef01d6262373150412439d33c/yellowpaper.md | 固定コミットの仕様。R8.4/R8.5および未解決項目を限定読取。文書全体の実装一致を検証したとはしない |
| P12 | https://github.com/flop-labs/network/releases/tag/sdk/v0.6.0 | 公式SDKリリースノート。アーカイブはサービスの実装ソースではない |
| P13 | https://docs.flop.network/operators | 選択中は devnet / next / development。公開運用可能なリリース認定とは異なる |

以下のHTTP/RPC/MCP観測も一次データである。ただしAPI・台帳が報告した状態であり、独立したチェーンストレージ証明や仕様の確定とは異なる。

## 実在・使い方・観測結果

| サーフェス | 確認結果 | 使い方と条件 |
| --- | --- | --- |
| Explorer | `/api/health` HTTP 200、取得時 headLag 0 | https://explorer.devnet.flop.network 。参照・照合に使う。これだけで決済finalityを認定しない |
| Devnet RPC | 公開WSSでgenesis・runtime・finalized headの読み取り成功 | `wss://rpc.devnet.flop.network`。観測spec 1014027、transaction version 2 |
| Faucet | `/chain` と `/limits` HTTP 200 | https://faucet.flop.network 。チェーン識別と制限を先に照合。今回 `/fund` は呼んでいない |
| OpenAI互換API | health・OpenAPI・モデル一覧がHTTP 200 | `https://api.flop.network/v1`、OpenAPIのもう一つの公開baseは `/api/v1`。推論には利用可能なBearer権限が必要 |
| モデル一覧 | 3件のIDを観測 | 発見情報のみ。呼出可否、認証スコープ、支出権限、現在の空き枠を保証しない |
| ホスト型MCP | `https://mcp.flop.network/mcp` でinitialize・tools/list成功、server flop-network 0.2.0 | Streamable HTTP。34ツールの宣言を取得。`readOnlyHint` は自己記述で安全性監査の代わりにならない。秘密生成・インストールのツールは呼ばない |
| MCPの機能確認 | 読み取り2件のみ実行：providersは0件、agent pack manifestはmissingエラー | MCP全体が利用不能とはしない。providers 0件をマイナー総数0とは解釈しない。ホスト型にセッション購入ツールは宣言されていない |
| JS client | 公式リンク先のnpmで @flop-labs/client 0.2.2、Node >=22 | Bearerを使ったHTTPクライアント。インストール・実行はしていない |
| TypeScript SDK | npm latest 0.6.0、公式ノートの対応上限1014020 | 現行RPC 1014027の資格確認には不足。互換性ガードを外さない。Gateway RESTの利用までSDK対応待ちとする必要はない |
| npm CLI | latest 0.5.0、Node >=22 | SDK ^0.6.0に依存。公式文書の0.4.4表記とは区別する。実行していない |
| コンテナCLI | 公式feedは0.1.388と固定digestを掲載 | 配布情報を確認しただけで、取得可能・互換・実行成功とはしない。以前の匿名取得404は本調査の現在値とは分ける |
| Python SDK | PyPI flop-sdk 0.3.0、Python >=3.10 | 配布の実在を確認。現行Runtimeとの接続・署名・決済は未検証 |

Faucet・Gateway・Explorer・RPCが示したDevnet genesisは一致した：
`0x99c172c095340ace980631f9123544c6bebd4839f3437e463533422d8be2d631`。
Faucetのネットワーク設定はSS58 prefix 42、18 decimals、WalletConnect false。これはDIDと口座の公式紐付けを証明しない。

## Faucetの取得時点の制限

`/limits` は stale=false、faucet=openと回答。匿名枠は25 Devnet FLOP、同一アドレス24時間。連携本人確認枠は基本500、1回最大2000、7日計2000、本人確認単位24時間。agent枠は2、24時間、次回繰越に支出を要求するとのフィールドがある。匿名・linked・agentを同じルールとして扱わない。agent枠の認証手順はこのlimitsだけから確定しない。

全体の日次上限は10,000,000、取得時の残り8,158,333。クライアント側にはIP単位300 grants/day、IP range単位10000、IP cooldown 10秒が示される。数値は変動しうる。pendingGrantsも残っており、openや残高を個別grantの成功証拠にしない。Testnetの最終Faucet条件は未発表（P2）。

## 初日DID・Agent報酬・開始日時

| 論点 | 一次資料で確認したこと | 未確定／止める判断 |
| --- | --- | --- |
| 同一DID | P6のAgent初日説明に、TechnoCoreで使ったものと同じDID鍵でHTTP、Faucet、署名付き推論を行うとの記載がある | 文書上の要求は確認。現在のDevnet GatewayはSS58口座署名。DID鍵と別口座の公式対応付け、Testnetの実際の署名形式・エンドポイント・必須登録は未確認。ローカルco-controlを公式登録としない |
| 配分 | P9のAgent枠は1.2bn、全genesis配分4.4bnというDraft値。P11 R8.4はsettled compute-channel spendをAgent scoringの根拠とする | 計算式・会計単位・owner/delegate/registered identity・集約などに未解決項目がある。予定配分を確定値で算出しない |
| 活動 | P8/P11はFaucet・保有・製造された活動を配分証拠にしない | Technocore投稿、DID作成、活動日数、テスト件数から得点を作らない。共通管理口座や自己需要で水増ししない |
| 解錠 | P7/P9はAgentのlocked allocationからの推論利用3に対し1を解錠する説明 | 配分獲得とgenesis後解錠は別。P7は新ルールが未実装でruntimeは90日線形のままと明記。実装状態を独立検証しておらず、自動解釈で実行しない |
| Snapshot・claim | P8/P11は公表されたfinalized snapshotと配分入力の公開を要求。P9はgenesis口座への配分と解錠後claim transactionを説明 | Snapshot高・個別配分・公式claim開始・contractは未確認。P1は公式token/claim未開始と明記 |
| 開始日 | P1/P2/P6は2026-11-24をreadiness次第の目標とする。P8はQ4というDraft表示 | 確定日時・時刻・タイムゾーン・Testnet genesis/RPC・稼働開始は未確認。11/24を自動参加開始時刻にしない。Mainnet/TGEも確定日なし |

P6の「same DID」は一次記載が見つかったため、単なる二次仮説からは前進した。一方、既存口座の公式結合まで満たしたとは判断しない。§7に従い、資格・按分・解錠に関する未解決解釈は人間判断に留める。

P11のE.38はTestnetからのconversionに残る会計主体・集約等の未決事項、E.40は継続的なAgent報酬leg等の支払方式の未決事項である。owner/delegate/registered identityや支出基準の候補は後者にも記載されているが、これを確定済みのgenesis按分式として流用しない。

## セッション要求を混同しない

1. **概念モデル（P3/P10）**：model-weight hash、最大latency、compute量、confidentiality、feeの5概念。これをそのままREST JSONに送らない。
2. **Gateway REST（取得したOpenAPI）**：`POST /v1/chat/completions` の必須は `model` と `messages`。任意に `max_tokens`、`stream`、`max_cost_flop` 等。`max_wait_ms`を使うと `max_cost_flop` が必要。スキーマで定義されないキーは不可。HTTPスキーマの存在だけでは費用上限の全経路での強制を実証しない。
3. **Gateway登録（OpenAPI/P2/P3）**：署名challengeの `address`, `message`, `signature` を渡す。既存allowanceではBearerがローテーションされ、枠・期限は更新されない。クォータはFLOP、expiryはepoch milliseconds。新たに `wallet_enrollment_credit_cap_reached` も公開エラーに列挙されている。既存の結果不明をこの調査で再送しない。
4. **直接セッション（P4）**：SDK `runDirectSession` は `api`, `signer`, `miner`, `model`, `prompt`/`messages`, `maxFlop`（raw units）、`endpoint`、任意の `via`/`maxTokens` 等。旧文書のCLI例を互換確認なしに実行しない。escrowと追加手数料、協調決済とforce/finalizeを分離する。

## A-3の正規経路と現在の判断

**第一候補は既存のREST実行器**。公式base `/v1` で、既存口座の有効な認証情報を安全に回復し、`/keys/me`の期限・モデル・クォータ、Devnet genesis、費用条件を確認して、承認済みの短い推論1件と同じrequest IDのreceiptを照合する。SDKをインストールせず実装できるため、SDKのRuntime差はこのHTTP経路自体の障壁ではない。ただし現時点でSOVの有効な認証情報は確認できておらず、実行可能と認定しない。

**第二候補は直接セッション**。利用許可されたHTTPS接続先、マイナー・モデル・校正・DA・署名手順、対応クライアント、支出と回収の確認が前提。本観測の9オファーは全てvenue未掲載。MCPのproviders一覧も空で、利用可能な直接接続先は確立できなかった。ホスト型MCPからの推論購入経路は確認できず、ローカルwrite対応MCPの導入も行わない。

**HTLCやx402を無条件の代替にしない**。HTLCのappraisal/profile、x402の実際に許可された精算方法は別途確認が必要。OpenAPIに認証方式が載ることだけで支払い経路が有効とはしない。

### マンデートへの差分提案

- §2の同一DID条件には公式説明の根拠を追加できる。ただし既存DIDと別のSS58口座の公式紐付けは未確認。
- §2.3の「クライアント不在」はA-0で解消済み。残りは実アクセスと証拠化。SDK対応差をGateway HTTPにも一律適用しない。
- 公式文書のSDK/CLI番号はレジストリの観測値と異なる。文書の古い番号を固定しない。
- 「PoI 0から大半が非稼働」「他者は単発が多い」は今回の一次データでは証明していない。競合優位の確定根拠にしない。

`research-status.a2-proposal.json` は更新案のみ。既存research-status、公式watermark、経済判断、公開設定、自律送信設定は変更していない。実推論・署名・Faucet請求・秘密鍵アクセス・インストール・外部投稿は行っていない。
