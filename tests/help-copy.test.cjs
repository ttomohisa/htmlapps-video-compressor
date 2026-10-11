const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const removed = [
  "圧縮処理はこのブラウザ内で行い、実行時通信もCSPで禁止しています。",
  "圧縮処理はこのブラウザ内で行い、実行時通信はCSPで禁止したまま、WebAssemblyの実行だけを許可しています。",
  "Compression runs in this browser; CSP still blocks runtime network access while allowing WebAssembly execution only."
];
for (const file of ["src/index.template.html", "video-compressor.html"]) {
  test(`${file}: user help omits implementation commentary`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const text of removed) assert.ok(!html.includes(text), `Remove implementation copy from ${file}`);
  });
}
