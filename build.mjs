// siblings.js を配布ページと Tampermonkey スクリプトへ埋め込む。
// siblings.js を変更したら `node build.mjs` を実行すること。
import { readFileSync, writeFileSync } from 'node:fs';

const code = readFileSync('siblings.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const re = /(<script type="text\/plain" id="bml-code">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error('bml-code マーカーが index.html に見つかりません');
writeFileSync('index.html', html.replace(re, (_, start, end) => `${start}\n${code}${end}`));
console.log('embedded siblings.js into index.html (' + code.length + ' chars)');

const metadata = readFileSync('userscript.meta.txt', 'utf8').trim();
const userscript = `${metadata}\n\n// 自動生成ファイル。本体の変更は siblings.js へ。\n(() => {\n  'use strict';\n  if (document.getElementById('kyodai-panel')) return;\n  if (!document.querySelector('td.horse .family_line, a.horseName')) return;\n\n${code}\n})();\n`;
writeFileSync('keiba-siblings.user.js', userscript);
console.log('generated keiba-siblings.user.js');
