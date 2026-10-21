# 出馬表 兄弟チェッカー

JRA公式・地方競馬情報サイトの出馬表で、同じレースに出走する兄弟馬を確認するツールです。Tampermonkey版と従来のブックマークレット版を利用できます。

**配布ページ： [https://doujimakobo.github.io/keiba-siblings/](https://doujimakobo.github.io/keiba-siblings/)**

## できること

- **全兄弟**（父・母とも同じ）
- **異父兄弟**（母が同じ）
- **異母兄弟**（父が同じ）

を検出し、出馬表上の馬名の横に関係を表示します。右上の一覧では、関係ごとに分けて馬番・馬名・性別（牡・牝・せん）を縦並びで確認できます。

## 対応ページ

- [JRA公式 出馬表](https://www.jra.go.jp/JRADB/accessD.html)
- [地方競馬情報サイト 出馬表](https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/TodayRaceInfoTop)

## 使い方

### Tampermonkey版（自動表示）

1. ブラウザにTampermonkey拡張を導入する
2. [keiba-siblings.user.js](https://doujimakobo.github.io/keiba-siblings/keiba-siblings.user.js) を開く
3. Tampermonkeyの画面で「インストール」を選ぶ
4. JRA公式または地方競馬情報サイトの出馬表を開くと、自動で表示される

ページ読み込み後（`document-idle`）に一度だけ実行します。出馬表がなければ何も表示せず、警告も出しません。二重起動しても既存のパネルは消しません。

表示されない場合（任意のトラブルシュート）：Chrome系ブラウザのTampermonkey 5.3以降では、拡張機能の詳細で「ユーザースクリプトを許可」（Chrome 138以降）またはデベロッパーモードを有効にしてください。詳しくは[公式FAQ](https://www.tampermonkey.net/faq.php?locale=ja&q=Q209)を参照してください。

### ブックマークレット版

1. 配布ページの「兄弟チェック」ボタンをブックマークバーへドラッグして登録する
2. 対応サイトの出馬表を開く
3. 登録したブックマークをクリックする

もう一度クリックすると表示を消せます。ブックマークレットを更新した場合は、配布ページから登録し直してください。

## データと制約

- 兄弟馬の表示処理にサーバー・APIは不要です。ブラウザに表示中の出馬表から父・母・馬番・性別を読むだけで、この処理では外部通信は行いません。Tampermonkey版のインストール・更新時にはコードを取得する通信が発生します。
- 出馬表側のHTML構造が変わると動かなくなる可能性があります。
- 現在は性別を表示します。「異母姉妹」「異母兄妹」など年齢順まで含む厳密な表記には、生年月日データの追加取得が必要です。

## 開発

- `siblings.js` — Tampermonkey版・ブックマークレット版共通の本体
- `index.html` — GitHub Pagesの配布ページ
- `userscript.meta.txt` — Tampermonkey版のメタデータ
- `keiba-siblings.user.js` — 生成されるTampermonkey版
- `build.mjs` — 本体を配布ページ `index.html` と `keiba-siblings.user.js` へ埋め込むビルドスクリプト

本体を変更したら、`node build.mjs` を実行してから公開します。Tampermonkey版の更新を配信する際は、`userscript.meta.txt` の `@version` を更新してからビルド・公開すると、Tampermonkeyの更新対象になります。
