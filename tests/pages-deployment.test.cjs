'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const bytes = relative => fs.readFileSync(path.join(root, relative));

test('the reviewed same-origin COI worker is pinned and carries its MIT notice', () => {
  const lock = JSON.parse(read('coi-serviceworker.lock.json'));
  assert.equal(lock.name, 'coi-serviceworker');
  assert.equal(lock.version, '0.1.7');
  assert.equal(lock.commit, '7b1d2a092d0d2dd2b7270b6f12f13605de26f214');
  assert.equal(lock.license, 'MIT');
  assert.equal(
    crypto.createHash('sha256').update(bytes('vendor/coi-serviceworker/coi-serviceworker.js')).digest('hex'),
    lock.sha256
  );
  assert.match(read('licenses/coi-serviceworker-MIT.txt'), /Copyright \(c\) 2021 Guido Zuidhof/);
});

test('the GitHub Pages workflow publishes the staged site rather than raw dist', () => {
  const workflow = read('.github/workflows/deploy-pages.yml');
  assert.match(workflow, /path: pages-dist/);
  assert.match(workflow, /pages-dist\/mt\/index\.html/);
  assert.match(workflow, /pages-dist\/mt\/coi-serviceworker\.js/);
  const stage = read('scripts/prepare-pages.ps1');
  assert.match(stage, /Get-ChildItem -LiteralPath \$Dist -Force/);
  assert.match(stage, /coepCredentialless: \(\) => false/);
  assert.match(stage, /coepDegrade: \(\) => false/);
  assert.match(stage, /window\.crossOriginIsolated === false/);
});

test('ST Pages root keeps the original self-contained ST HTML and all dist URLs', () => {
  assert.deepEqual(bytes('pages-dist/index.html'), bytes('dist/index.html'));
  assert.doesNotMatch(read('pages-dist/index.html'), /coi-serviceworker\.js/);
  assert.match(read('pages-dist/index.html'), /connect-src 'none'/);
  const existingDist = fs.readdirSync(path.join(root, 'dist'), { withFileTypes: true })
    .filter(item => item.isFile()).map(item => item.name);
  for (const filename of existingDist) {
    assert.deepEqual(bytes('pages-dist/' + filename), bytes('dist/' + filename),
      'Existing published artifact must remain accessible: ' + filename);
  }
  assert.equal(fs.existsSync(path.join(root, 'pages-dist/.nojekyll')), true);
});

test('raw MT standalone remains untouched and does not install service workers', () => {
  assert.deepEqual(bytes('pages-dist/index.mt.html'), bytes('dist/index.mt.html'));
  const raw = read('dist/index.mt.html');
  assert.match(raw, /worker-src blob:;/);
  assert.match(raw, /script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:;/);
  assert.doesNotMatch(raw, /coi-serviceworker|window\.coi/);
  assert.match(raw, /connect-src 'none'/);
});

test('only staged Pages /mt/ uses the scoped COI fallback and narrow CSP allowance', () => {
  const raw = read('dist/index.mt.html');
  const staged = read('pages-dist/mt/index.html');
  const worker = read('pages-dist/mt/coi-serviceworker.js');
  assert.equal(worker, read('vendor/coi-serviceworker/coi-serviceworker.js'));
  assert.match(staged, /window\.crossOriginIsolated === false/);
  assert.match(staged, /coiScript\.src = "\.\/coi-serviceworker\.js"/);
  assert.match(worker, /n\.serviceWorker\.register\(window\.document\.currentScript\.src\)/);
  assert.match(staged, /script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:/);
  assert.match(staged, /worker-src 'self' blob:/);
  assert.match(staged, /connect-src 'none'/);
  assert.doesNotMatch(staged, /script-src[^;]*https:|connect-src[^;]*https:|worker-src[^;]*https:/);
  assert.match(staged, /const RUNTIME_VARIANT=["']multi-thread["']/);

  // Byte-for-byte application parity after removing the *only* Pages-specific changes.
  const undoCsp = staged
    .replace("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
      "script-src 'unsafe-inline' 'wasm-unsafe-eval' blob:")
    .replace("worker-src 'self' blob:", "worker-src blob:");
  const undoBootstrap = undoCsp.replace(
    /  <!-- GitHub Pages only: COOP\/COEP fallback[\s\S]*?<\/script>\r?\n(?=<\/head>)/, ''
  );
  assert.equal(undoBootstrap, raw,
    'The staged MT page must differ from standalone only by the reviewed CSP and COI bootstrap');
});
