'use strict';
// Exercise the actual core embedded in the generated app, using its real argument
// builder. MEMFS substitutes for browser WORKERFS only; no media or codec mocks.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const test = require('node:test');
const {readMp4} = require('./test-support/timing-readers.js');
const root = path.resolve(__dirname, '..');
const htmlPath = path.resolve(process.argv[2] || path.join(root, 'dist/index.html'));
const html = fs.readFileSync(htmlPath, 'utf8');
const readConstant = name => {
  const match = html.match(new RegExp(`const ${name}=(.+);`));
  assert.ok(match, `${name} must be present in built HTML`);
  return JSON.parse(match[1]);
};
const manifest = readConstant('BUILD_MANIFEST');
const bundle = readConstant('EMBEDDED_ASSET_BUNDLE').dependencies['ffmpeg-wasm-builder'];
const dependency = manifest.dependencies.find(item => item.id === 'ffmpeg-wasm-builder');
const bytes = key => {
  const asset = bundle.assets[key];
  const value = Buffer.from(asset.base64, 'base64');
  assert.ok(['base64', 'gzip-base64'].includes(asset.encoding));
  return asset.encoding === 'gzip-base64' ? zlib.gunzipSync(value) : value;
};
const coreJs = bytes('core-js').toString('utf8');
const wasm = bytes('core-wasm');
const context = {self: {location: {href: 'file:///ffmpeg.js'}}, console,
  URL, WebAssembly, TextDecoder, TextEncoder, performance, setTimeout, clearTimeout,
  Uint8Array, ArrayBuffer};
vm.createContext(context);
vm.runInContext(coreJs, context);
const argsContext = {els: {}};
vm.createContext(argsContext);
for (const name of ['codecInfo', 'buildArgs']) {
  const match = html.match(new RegExp(`    function ${name}\\([^\\n]+`));
  assert.ok(match, `${name} must be present in built app`);
  vm.runInContext(match[0], argsContext);
}
function appArgs({fps = 0, codec = 'h264', audio = false} = {}) {
  argsContext.els = Object.fromEntries(Object.entries({resolutionSelect: 'original',
    bitrateInput: '300', audioBitrateSelect: '32', fpsSelect: fps || 'original',
    codecSelect: codec, speedSelect: 'fastest'}).map(([key, value]) => [key, {value}]));
  argsContext.els.removeAudio = {checked: !audio};
  return Array.from(argsContext.buildArgs('/workerfs/input.mp4', codec === 'vp9' ? '/output.webm' : '/output.mp4'));
}
async function run(input, args, output) {
  const logs = [];
  const core = await context.createFFmpegCore({wasmBinary: wasm,
    instantiateWasm: (imports, success) => {
      const module = new WebAssembly.Module(wasm);
      const instance = new WebAssembly.Instance(module, imports);
      success(instance, module); return instance.exports;
    }, print: () => {}, printErr: message => logs.push(String(message))});
  core.FS.mkdirTree('/workerfs');
  core.FS.writeFile('/workerfs/input.mp4', input);
  let exit;
  try { exit = core.callMain(args); }
  catch (error) { if (typeof error.status !== 'number') throw error; exit = error.status; }
  assert.equal(exit, 0, logs.slice(-10).join('\n'));
  return Buffer.from(core.FS.readFile(output));
}
const fixture = name => fs.readFileSync(path.join(__dirname, 'timing-fixtures', `timing-${name}.mp4`));
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
function checkMp4(data, expectedPts, endpoint, variableRate = false) {
  const timing = readMp4(data).video;
  assert.equal(timing.sampleCount, expectedPts.length, 'all encoded samples must remain');
  const pts = [...timing.pts].sort((a, b) => a - b);
  pts.forEach((value, index) => near((value - pts[0]) / timing.timescale, expectedPts[index],
    1 / timing.timescale, `frame ${index} presentation timestamp`));
  assert.ok(timing.durations.every(value => value > 0), 'every MP4 sample, including the final sample, needs a positive duration');
  if (!variableRate) {
    near(timing.duration / timing.timescale, endpoint, 1 / timing.timescale, 'video track duration');
    near((timing.presentationEnd - pts[0]) / timing.timescale, endpoint, 1 / timing.timescale, 'presentation endpoint');
  }
  assert.ok(timing.editPresentationEnd, 'video edit must cover the full final frame');
  const editEnd = timing.editPresentationEnd.numerator / timing.editPresentationEnd.denominator;
  near((editEnd - pts[0]) / timing.timescale, endpoint, .0011, 'edit-list endpoint');
  return timing;
}
test('built core bytes match their manifest and canonical release pin', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'dependencies.json'))).dependencies[0];
  assert.equal(bundle.version, config.version);
  assert.equal(dependency.version, config.version);
  assert.equal(dependency.source, 'github-release');
  assert.match(dependency.archiveSha256, /^[0-9a-f]{64}$/);
  assert.match(dependency.sourceSha256, /^[0-9a-f]{64}$/);
  assert.equal(dependency.correspondingSourceUrl,
    `https://github.com/${config.repository}/releases/download/v${config.version}/${config.sourceAsset.replace('{version}', config.version)}`);
  for (const key of ['core-js', 'core-wasm']) {
    const content = bytes(key);
    const entry = dependency.assets.find(asset => asset.key === key);
    assert.equal(entry.bytes, content.length);
    assert.equal(entry.sha256, crypto.createHash('sha256').update(content).digest('hex'));
  }
});
for (const fps of [0, 24, 30]) test(`embedded MP4 core retains the final frame interval at ${fps || 'Original'} FPS`, async () => {
  const rate = fps || 24;
  const output = await run(fixture('cfr'), appArgs({fps}), '/output.mp4');
  const timing = checkMp4(output, Array.from({length: 3 * rate}, (_, i) => i / rate), 3);
  timing.durations.forEach(duration => near(duration / timing.timescale, 1 / rate, 1 / timing.timescale, 'sample duration'));
});
test('Original preserves variable presentation timestamps and final edit coverage', async () => {
  checkMp4(await run(fixture('vfr'), appArgs(), '/output.mp4'), [0, .083, .207, .249, .491, .532], .573, true);
});
test('a one-frame MP4 retains its entire display interval', async () => {
  checkMp4(await run(fixture('single'), appArgs(), '/output.mp4'), [0], .1);
});
test('audio cannot hide a shortened video endpoint', async () => {
  const output = await run(fixture('audio-rotated'), appArgs({fps: 24, audio: true}), '/output.mp4');
  assert.ok(output.includes(Buffer.from('mp4a')), 'AAC must remain present');
  checkMp4(output, Array.from({length: 48}, (_, i) => i / 24), 2);
});
test('VP9 and Opus remain available with a complete endpoint', async () => {
  const output = await run(fixture('audio-rotated'), appArgs({fps: 24, codec: 'vp9', audio: true}), '/output.webm');
  assert.ok(output.includes(Buffer.from('V_VP9')));
  assert.ok(output.includes(Buffer.from('A_OPUS')));
  const infoBytes = await run(output, ['--input', '/workerfs/input.mp4', '--inspect-output', '/inspect.json'], '/inspect.json');
  const info = JSON.parse(infoBytes.toString());
  assert.equal(info.video.codec, 'vp9');
  near(info.duration, 2, .01, 'WebM endpoint');
});
test('root copy and self-extract payload contain the same tested HTML', () => {
  assert.equal(fs.readFileSync(path.join(root, 'video-compressor.html'), 'utf8'), html);
  const wrapper = fs.readFileSync(path.join(path.dirname(htmlPath), 'index.self-extract.html'), 'utf8');
  const payload = wrapper.match(/<script id="self-extract-payload" type="application\/octet-stream">([\s\S]+?)<\/script>/);
  assert.ok(payload);
  assert.equal(zlib.gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8'), html);
});
