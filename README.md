# JRA出馬表 兄弟チェッカー

JRA公式の出馬表ページで、同レース内に **全兄弟・異父兄弟（同母）・異母兄弟（同父）** の馬がいるかを表示するブックマークレット。

- サーバー不要・API不要。ブラウザに表示中の JRA 出馬表ページの DOM（`td.horse` 内の `ul.family_line`）から父・母を読み取るだけで、外部通信は行わない。
- 配布は GitHub Pages（`index.html` がブックマークレット登録ページ）。

## ファイル

- `siblings.js` — 本体（読みやすい形のソース。index.html が実行時に `javascript:` URL へ変換）
- `index.html` — 配布ページ

## 公開

GitHub にリポジトリを作成 → Settings > Pages > Deploy from branch (main, root) で公開。
