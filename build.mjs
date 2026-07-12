// siblings.js を index.html の <script id="bml-code"> 内に埋め込む。
// siblings.js を変更したら `node build.mjs` を実行すること。
import { readFileSync, writeFileSync } from 'node:fs';

const code = readFileSync('siblings.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const re = /(<script type="text\/plain" id="bml-code">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error('bml-code マーカーが index.html に見つかりません');
writeFileSync('index.html', html.replace(re, `$1\n${code}$2`));
console.log('embedded siblings.js into index.html (' + code.length + ' chars)');
