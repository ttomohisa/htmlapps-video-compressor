'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('one dependency pin yields explicit ST/MT assets',()=>{
 const dep=JSON.parse(read('dependencies.json')).dependencies[0];
 assert.equal(dep.releaseAsset,'ffmpeg-wasm-video-compressor-{threading}-v{version}.zip');
 assert.equal(dep.version,'1.10.3');
});
test('normal build creates both modes and separate manifest/root names',()=>{
 const b=read('build-standalone.ps1');
 assert.match(b,/ValidateSet\("all", "single-thread", "multi-thread"\)/);
 for(const name of ['index.mt.html','dependency-manifest.mt.json','video-compressor.mt.html','index.mt.self-extract.html'])assert.ok(b.includes(name),name);
 assert.match(b,/\$Threading -eq "all"/);
});
test('variant cache and embedded manifest cannot mix ST and MT',()=>{
 const b=read('build-standalone.ps1');
 assert.match(b,/\$cacheKey.*\$Threading/);
 assert.match(b,/runtime.threading -ne \$Threading/);
 assert.match(b,/threading = \$Threading/);
});
test('worker guards MT and uses embedded core Blob for nested workers',()=>{
 const s=read('src/index.template.html');
 assert.match(s,/payload.threading==='multi-thread'/);
 assert.match(s,/mainScriptUrlOrBlob:new Blob\(\[payload.coreJsText\]/);
});
test('drop and estimate backgrounds contain no decorative gradients',()=>{
 const s=read('src/index.template.html');
 assert.doesNotMatch(s,/\.drop-zone::before/);
 assert.match(s,/\.estimate-card\{[^}]*background:var\(--surface\)/);
});
test('Cloudflare preview isolates only MT artifact routes',()=>{
 const h=read('cloudflare/_headers');
 assert.match(h,/\/index\.mt\.html\n  Cross-Origin-Opener-Policy: same-origin/);
 assert.match(h,/Cross-Origin-Embedder-Policy: require-corp/);
 assert.doesNotMatch(h,/^\/\*$/m);
});
test('official artifacts include both MT outputs and distinct manifests',()=>{
 for(const p of ['build-standalone','validate','deploy-pages']) {
  const w=read(`.github/workflows/${p}.yml`);
  for(const name of ['dist/index.mt.html','dist/index.mt.self-extract.html','dist/dependency-manifest.mt.json','dist/self-extract-manifest.mt.json','video-compressor.mt.html'])assert.ok(w.includes(name),`${p}: ${name}`);
 }
});
test('custom ST/MT outputs resolve from the repository rather than the caller directory',()=>{
 const b=read('build-standalone.ps1');
 assert.match(b,/\$customOutput = if \(\[IO.Path\]::IsPathRooted\(\$OutputPath\)\) \{ \$OutputPath \} else \{ Join-Path \$Root \$OutputPath \}/);
 assert.match(b,/\$arguments.OutputPath = if \(\$variant -eq "single-thread"\) \{ \$customOutput \}/);
 assert.match(b,/GetFullPath\(\$customOutput\)/);
});
