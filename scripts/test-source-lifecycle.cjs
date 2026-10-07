'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { File } = require('node:buffer');
const sourcePath = process.argv[2] || path.join(__dirname, '../src/index.template.html');
const html = fs.readFileSync(sourcePath, 'utf8');

// Execute the real inline application; only DOM/media events, Worker transport,
// timers and asset preparation are doubles. No actual video or WASM is executed.
function deferred() {
  let resolve, reject;
  const promise = new Promise((r, j) => { resolve = r; reject = j; });
  return { promise, resolve, reject };
}
async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
function environment() {
  class Element {
    constructor(id = '') {
      Object.assign(this, { id, value: '', textContent: '', disabled: false, hidden: false,
        checked: false, dataset: {}, style: {}, children: [], events: new Map(), attributes: new Map() });
      const classes = new Set();
      this.classList = {
        add: (...x) => x.forEach(v => classes.add(v)),
        remove: (...x) => x.forEach(v => classes.delete(v)),
        contains: x => classes.has(x),
        toggle: (x, on) => { const yes = on === undefined ? !classes.has(x) : on; yes ? classes.add(x) : classes.delete(x); return yes; }
      };
    }
    addEventListener(type, fn, options = {}) {
      if (!this.events.has(type)) this.events.set(type, []);
      this.events.get(type).push({ fn, once: options.once });
    }
    removeEventListener(type, fn) { this.events.set(type, (this.events.get(type) || []).filter(x => x.fn !== fn)); }
    dispatch(type, extra = {}) {
      for (const event of [...(this.events.get(type) || [])]) {
        if (event.once) this.removeEventListener(type, event.fn);
        event.fn({ target: this, preventDefault() {}, ...extra });
      }
    }
    setAttribute(k, v) { this.attributes.set(k, v); }
    getAttribute(k) { return this.attributes.get(k); }
    removeAttribute(k) { this.attributes.delete(k); if (k === 'src') this.src = ''; }
    append(...x) { this.children.push(...x); }
    remove() {} load() {}
    pause() { this.pauses = (this.pauses || 0) + 1; }
    play() { return Promise.resolve(); }
    scrollIntoView() {} getBoundingClientRect() { return { height: 40, top: 0 }; }
    showModal() { this.open = true; } close() { this.open = false; this.dispatch('close'); }
    focus() { this.focused = true; } select() { this.selected = true; }
    click() { this.dispatch('click'); }
  }
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); };
  for (const [id, value] of Object.entries({ resolutionSelect: '1920', codecSelect: 'h264',
    bitrateInput: '3200', bitrateRange: '3200', fpsSelect: 'original', speedSelect: 'fast', audioBitrateSelect: '96' })) el(id).value = value;
  const workers = [], timers = new Map(), urls = new Map();
  let timerId = 0, urlId = 0;
  class WorkerDouble {
    constructor(url) { this.url = url; this.terminated = false; workers.push(this); }
    postMessage(message) { this.message = message; }
    terminate() { this.terminated = true; }
    reply(data) { this.onmessage({ data: { id: this.message.id, ok: true, data } }); }
    fail(error) { this.onmessage({ data: { id: this.message.id, ok: false, error } }); }
  }
  const document = {
    getElementById: el, createElement: tag => new Element(tag),
    documentElement: new Element('html'), body: new Element('body'), querySelector: () => new Element('header'),
    querySelectorAll: selector => selector === 'input,select,button.recommend-btn'
      ? [...elements.values()].filter(e => /Input$|Select$|Range$|removeAudio|recommendButton/.test(e.id)) : []
  };
  const sandbox = {
    document, navigator: { language: 'en' }, localStorage: { getItem() { return null; }, setItem() {} },
    console: { error() {}, warn() {} }, Blob, File, TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, Map, Set,
    Promise, Date, Math, Number, String, Error, performance: { now: () => 1000 },
    atob: x => Buffer.from(x, 'base64').toString('binary'),
    URL: { createObjectURL: x => { const url = 'blob:test/' + ++urlId; urls.set(url, x); return url; }, revokeObjectURL: x => urls.delete(x) },
    Worker: WorkerDouble,
    setTimeout: (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id), setInterval: () => ++timerId, clearInterval() {}
  };
  sandbox.window = { addEventListener() {}, scrollTo() {}, scrollY: 0 };
  const context = vm.createContext(sandbox);
  let script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1]
    .replace('__APP_CONFIG_JSON__', '{}').replace('__BUILD_MANIFEST_JSON__', '{}').replace('__EMBEDDED_ASSET_BUNDLE_JSON__', '{}');
  script = script.replace(/\}\)\(\);\s*$/, 'globalThis.api={state,els,selectFile,clearFile,compress,cancel,buildArgs,targetDimensions,download,share,t};})();');
  vm.runInContext(script, context, { filename: sourcePath });
  const core = deferred();
  sandbox.window.StandaloneAssets = { text: () => '', bytesAsync: () => core.promise };
  const api = sandbox.api;
  const fixture = (name = 'alpha.mp4', size = 100000) => ({ name, size, type: 'video/mp4' });
  const metadata = (duration = 10, width = 1280, height = 720) => {
    Object.assign(el('sourcePreview'), { duration, videoWidth: width, videoHeight: height });
    el('sourcePreview').dispatch('loadedmetadata');
  };
  const inspection = (fps = 30, duration = 10, width = 1280, height = 720) =>
    new TextEncoder().encode(JSON.stringify({ duration, video: { displayWidth: width, displayHeight: height, bitRateKbps: 1800, fps } })).buffer;
  async function ready(name = 'alpha.mp4') {
    core.resolve(new Uint8Array([0]));
    const loading = api.selectFile(fixture(name)); metadata(); await flush();
    workers.at(-1).reply(inspection()); await loading;
  }
  return { api, el, workers, timers, urls, core, fixture, metadata, inspection, ready, context };
}
function frameFallback(e) {
  const callbacks = new Map(); let next = 0;
  e.el('sourcePreview').requestVideoFrameCallback = callback => { callbacks.set(++next, callback); return next; };
  e.el('sourcePreview').cancelVideoFrameCallback = id => callbacks.delete(id);
  return callbacks;
}
async function failedInspection(e) {
  e.core.resolve(new Uint8Array([0]));
  const loading = e.api.selectFile(e.fixture()); e.metadata(); await flush();
  e.workers.at(-1).fail('synthetic inspection error'); await flush();
  return { loading };
}
function noWorkerResources(e) {
  assert.equal(e.api.state.worker, null);
  assert.equal(e.api.state.pending.size, 0);
  assert(e.workers.every(worker => worker.terminated));
  assert(![...e.urls.values()].some(value => value.type === 'text/javascript'));
}

test('clear resets VP9 codec and its derived extension together', async () => {
  const e = environment(); await e.ready(); e.el('codecSelect').value = 'vp9'; e.el('codecSelect').dispatch('change');
  assert.equal(e.el('outputExtension').textContent, '.webm'); e.api.clearFile();
  assert.equal(e.el('codecSelect').value, 'h264'); assert.equal(e.el('outputExtension').textContent, '.mp4');
  assert.equal(e.api.state.file, null); assert.equal(e.el('compressButton').disabled, true);
  assert.equal(e.el('mobileCompressButton').disabled, true); noWorkerResources(e);
});
test('clear during core preparation cannot create an obsolete worker', async () => {
  const e = environment(); const loading = e.api.selectFile(e.fixture()); e.metadata(); await flush();
  e.api.clearFile(); e.core.resolve(new Uint8Array([0])); await flush();
  assert.equal(e.workers.length, 0); await loading; noWorkerResources(e); assert.equal(e.api.state.inspecting, false);
});
test('replacement during shared core preparation creates only the current worker', async () => {
  const e = environment(); const a = e.api.selectFile(e.fixture()); e.metadata(); await flush();
  const b = e.api.selectFile(e.fixture('beta.mp4')); e.metadata(20, 1920, 1080); await flush();
  e.core.resolve(new Uint8Array([0])); await flush(); assert.equal(e.workers.length, 1);
  assert.equal(e.workers[0].message.payload.inputFile.name, 'beta.mp4');
  e.workers[0].reply(e.inspection(60, 20, 1920, 1080)); await Promise.all([a, b]);
  assert.equal(e.api.state.source.fps, 60); noWorkerResources(e);
});
test('superseded fallback callbacks cannot reset current bitrate or preview', async () => {
  const e = environment(), frames = frameFallback(e); const { loading: a } = await failedInspection(e);
  const lateFrame = [...frames.values()][0], lateTimeout = [...e.timers.values()].find(x => x.ms === 2600).fn;
  const b = e.api.selectFile(e.fixture('beta.mp4')); e.metadata(20, 1920, 1080); await flush();
  e.workers.at(-1).reply(e.inspection(60, 20, 1920, 1080)); await b;
  e.el('bitrateInput').value = '444'; e.el('bitrateInput').dispatch('change'); e.el('sourcePreview').currentTime = 4;
  const pauses = e.el('sourcePreview').pauses; lateTimeout(); lateFrame(0, { mediaTime: 1 }); await a;
  assert.equal(e.el('bitrateInput').value, 444); assert.equal(e.api.state.source.fps, 60);
  assert.equal(e.el('sourcePreview').currentTime, 4); assert.equal(e.el('sourcePreview').pauses, pauses);
  assert.equal(frames.size, 0); assert(![...e.timers.values()].some(x => x.ms === 2600)); noWorkerResources(e);
});
test('clearing fallback cancels frame request and timer without touching reset state', async () => {
  const e = environment(), frames = frameFallback(e); const { loading } = await failedInspection(e);
  const lateFrame = [...frames.values()][0], lateTimeout = [...e.timers.values()].find(x => x.ms === 2600).fn;
  e.api.clearFile(); await flush(); assert.equal(frames.size, 0); assert(![...e.timers.values()].some(x => x.ms === 2600));
  const bitrate = e.el('bitrateInput').value; lateFrame(0, { mediaTime: 1 }); lateTimeout(); await loading;
  assert.equal(e.api.state.file, null); assert.equal(e.el('bitrateInput').value, bitrate); noWorkerResources(e);
});
test('retired metadata handlers cannot mutate the next source or publish errors', async () => {
  const e = environment(); const a = e.api.selectFile(e.fixture());
  const oldMetadata = e.el('sourcePreview').events.get('loadedmetadata')[0].fn;
  const oldError = e.el('sourcePreview').events.get('error')[0].fn;
  const b = e.api.selectFile(e.fixture('beta.mp4'));
  Object.assign(e.el('sourcePreview'), { duration: 99, videoWidth: 22, videoHeight: 44 }); oldMetadata(); oldError();
  assert(Number.isNaN(e.api.state.source.duration)); assert.equal(e.el('toastRegion').children.length, 0);
  e.metadata(20, 1920, 1080); e.core.resolve(new Uint8Array([0])); await flush();
  e.workers.at(-1).reply(e.inspection(60, 20, 1920, 1080)); await Promise.all([a, b]); noWorkerResources(e);
});
test('clear detaches metadata events and settles the old selection', async () => {
  const e = environment(); const loading = e.api.selectFile(e.fixture()); e.api.clearFile();
  assert.equal(e.el('sourcePreview').events.get('loadedmetadata').length, 0);
  assert.equal(e.el('sourcePreview').events.get('error').length, 0);
  assert(![...e.timers.values()].some(x => x.ms === 5000)); await loading; noWorkerResources(e);
});
test('late worker messages and errors cannot affect replacement inspection', async () => {
  const e = environment(); e.core.resolve(new Uint8Array([0])); const a = e.api.selectFile(e.fixture()); e.metadata(); await flush();
  const old = e.workers[0]; const b = e.api.selectFile(e.fixture('beta.mp4')); e.metadata(); await flush(); const current = e.workers[1];
  old.onmessage({ data: { event: 'log', message: 'obsolete' } }); old.onmessage({ data: { event: 'progress', ratio: 1 } });
  old.onerror({ message: 'obsolete worker failure' }); old.reply(e.inspection(120));
  assert.equal(e.el('logBox').textContent, ''); assert.equal(current.terminated, false);
  current.reply(e.inspection(60)); await Promise.all([a, b]); assert.equal(e.api.state.source.fps, 60); noWorkerResources(e);
});
test('failed inspection fallback preserves a user-chosen bitrate and cleans resources', async () => {
  const e = environment(), frames = frameFallback(e); const { loading } = await failedInspection(e);
  e.el('bitrateInput').value = '444'; e.el('bitrateInput').dispatch('change');
  for (let i = 0; i < 14; i++) { const [id, callback] = [...frames][0]; frames.delete(id); callback(0, { mediaTime: i / 30 }); }
  await loading; assert.equal(e.el('bitrateInput').value, 444); assert(Math.abs(e.api.state.source.fps - 30) < 0.01);
  assert.equal(e.api.state.source.bitrateMeasured, false); assert.equal(e.api.state.inspecting, false);
  assert.equal(e.el('sourcePreview').currentTime, 0); assert.equal(frames.size, 0); noWorkerResources(e);
});
test('worker errors clean resources and compression can retry', async () => {
  const e = environment(); await e.ready(); const failing = e.api.compress(); await flush();
  e.workers.at(-1).onerror({ message: 'synthetic failure' }); await failing;
  assert.equal(e.api.state.outputFile, null); assert.equal(e.api.state.processing, false); noWorkerResources(e);
  const retry = e.api.compress(); await flush(); e.workers.at(-1).reply(new Uint8Array([1, 2, 3]).buffer); await retry;
  assert.equal(e.api.state.outputFile.size, 3); noWorkerResources(e);
});
test('cancel then immediate retry cannot be disposed by the retired compression', async () => {
  const e = environment(); await e.ready(); const first = e.api.compress(); await flush(); const old = e.workers.at(-1);
  e.api.cancel(); const retry = e.api.compress(); await flush(); const current = e.workers.at(-1);
  assert.notEqual(old, current); assert.equal(current.terminated, false); assert.equal(e.api.state.processing, true);
  old.onmessage({ data: { event: 'log', message: 'obsolete' } }); old.onmessage({ data: { event: 'progress', ratio: 1 } });
  old.onerror({ message: 'obsolete failure' }); old.reply(new Uint8Array([9]).buffer);
  assert.equal(e.api.state.outputFile, null); assert.equal(e.el('logBox').textContent, '');
  current.reply(new Uint8Array([1, 2, 3]).buffer); await Promise.all([first, retry]);
  assert.equal(e.api.state.outputFile.size, 3); assert.equal(e.api.state.processing, false); noWorkerResources(e);
});
test('cancel during cached-core microtask prevents worker creation and output publication', async () => {
  const e = environment(); await e.ready(); const count = e.workers.length;
  const compression = e.api.compress(); e.api.cancel(); await flush();
  assert.equal(e.workers.length, count); await compression;
  assert.equal(e.api.state.outputFile, null); assert.equal(e.api.state.processing, false); noWorkerResources(e);
});
for (const codec of ['h264', 'vp9']) test('normal ' + codec + ' names, arguments, dimensions, estimate and result remain intact', async () => {
  const e = environment(); await e.ready(); assert.equal(e.el('bitrateInput').value, 1600); assert.equal(e.el('estimateSize').textContent, '2.09 MB');
  assert.deepEqual(JSON.parse(JSON.stringify(e.api.targetDimensions())), { width: 1280, height: 720 });
  e.el('codecSelect').value = codec; e.el('codecSelect').dispatch('change'); e.el('removeAudio').checked = codec === 'vp9'; e.el('removeAudio').dispatch('change');
  const ext = codec === 'vp9' ? 'webm' : 'mp4'; e.el('outputNameInput').value = '  日本語 <clip>.' + ext + ' ';
  const p = e.api.compress(); await flush(); const worker = e.workers.at(-1), args = Array.from(worker.message.payload.args);
  assert.deepEqual(args, ['--input', '/workerfs/input.mp4', '--output', '/output.' + ext, '--codec', codec, '--speed', 'fast', '--max-width', '1280', '--max-height', '1280', '--fps', '0', '--video-bitrate', codec === 'vp9' ? '1250' : '1600', '--audio-bitrate', '96', ...(codec === 'vp9' ? ['--no-audio'] : [])]);
  worker.reply(new Uint8Array([4, 5, 6]).buffer); await p;
  assert.equal(e.api.state.outputFile.name, '日本語 -clip-.' + ext); assert.equal(e.api.state.outputFile.type, 'video/' + ext);
  assert.deepEqual(Array.from(new Uint8Array(await e.api.state.outputFile.arrayBuffer())), [4, 5, 6]); noWorkerResources(e);
});
test('clearing active inspection terminates its worker and ignores its late result', async () => {
  const e = environment(); e.core.resolve(new Uint8Array([0])); const loading = e.api.selectFile(e.fixture()); e.metadata(); await flush(); const worker = e.workers.at(-1);
  e.api.clearFile(); await loading; worker.reply(e.inspection(60)); worker.onerror({ message: 'late error' });
  assert.equal(e.api.state.file, null); assert.equal(e.el('compressButton').disabled, true); noWorkerResources(e);
});
test('invalid replacement leaves the current source and custom name unchanged', async () => {
  const e = environment(); await e.ready(); e.el('outputNameInput').value = 'custom'; const file = e.api.state.file;
  await e.api.selectFile({ name: 'notes.txt', type: 'text/plain', size: 3 }); assert.equal(e.api.state.file, file); assert.equal(e.el('outputNameInput').value, 'custom');
  await e.api.selectFile({ name: 'huge.mp4', type: 'video/mp4', size: 2 * 1024 ** 3 }); assert.equal(e.api.state.file, file); assert.equal(e.el('outputNameInput').value, 'custom'); noWorkerResources(e);
});
test('active compression keeps its source until cancellation permits new selection', async () => {
  const e = environment(); await e.ready(); const file = e.api.state.file, compression = e.api.compress(); await flush(); const worker = e.workers.at(-1);
  const ignored = e.api.selectFile(e.fixture('beta.mp4')); await flush(); assert.equal(e.api.state.file, file); assert.equal(worker.terminated, false); await ignored;
  e.api.cancel(); const loading = e.api.selectFile(e.fixture('beta.mp4')); e.metadata(); await flush(); e.workers.at(-1).reply(e.inspection(60)); await Promise.all([compression, loading]);
  assert.equal(e.api.state.file.name, 'beta.mp4'); assert.equal(e.api.state.source.fps, 60); assert.equal(e.el('mobileCompressButton').disabled, false); noWorkerResources(e);
});
test('worker constructor and transport errors release URLs and allow retry', async () => {
  for (const boundary of ['constructor', 'postMessage']) {
    const e = environment(); await e.ready(); const Worker = e.context.Worker;
    if (boundary === 'constructor') e.context.Worker = class { constructor() { throw new Error('synthetic constructor failure'); } };
    else Worker.prototype.postMessage = function () { throw new Error('synthetic transport failure'); };
    await e.api.compress(); assert.equal(e.api.state.processing, false); assert.equal(e.api.state.outputFile, null); noWorkerResources(e);
    e.context.Worker = Worker; Worker.prototype.postMessage = function (message) { this.message = message; };
    const retry = e.api.compress(); await flush(); e.workers.at(-1).reply(new Uint8Array([1, 2, 3]).buffer); await retry;
    assert.equal(e.api.state.outputFile.size, 3); noWorkerResources(e);
  }
});


test('cleared preparation settles before shared core does', async () => {
  const e = environment(); const p = e.api.selectFile(e.fixture()); e.metadata(); await flush();
  let settled = false; p.then(() => settled = true); e.api.clearFile(); await flush();
  assert.equal(settled, true); assert.equal(e.workers.length, 0); noWorkerResources(e);
  e.core.reject(new Error('retired preparation failure')); await flush();
  assert.equal(e.el('toastRegion').children.length, 0); noWorkerResources(e);
});
test('resolved worker result followed by immediate cancel does not publish', async () => {
  const e = environment(); await e.ready(); const first = e.api.compress(); await flush();
  const old = e.workers.at(-1); old.reply(new Uint8Array([9]).buffer); e.api.cancel();
  const retry = e.api.compress(); await flush(); const current = e.workers.at(-1);
  assert.notEqual(current, old); assert.equal(e.api.state.processing, true); assert.equal(e.api.state.outputFile, null);
  current.reply(new Uint8Array([1, 2]).buffer); await Promise.all([first, retry]);
  assert.equal(e.api.state.outputFile.size, 2); noWorkerResources(e);
});
test('core microtask cancel immediate retry creates only retry worker', async () => {
  const e = environment(); await e.ready(); const count = e.workers.length;
  const first = e.api.compress(); e.api.cancel(); const retry = e.api.compress(); await flush();
  assert.equal(e.workers.length, count + 1); assert.equal(e.api.state.processing, true);
  e.workers.at(-1).reply(new Uint8Array([1]).buffer); await Promise.all([first, retry]);
  assert.equal(e.api.state.outputFile.size, 1); noWorkerResources(e);
});
test('repeated same File identity still retires earlier inspection', async () => {
  const e = environment(); e.core.resolve(new Uint8Array([0])); const file = e.fixture();
  const a = e.api.selectFile(file); e.metadata(); await flush(); const old = e.workers.at(-1);
  const b = e.api.selectFile(file); e.metadata(); await flush(); const current = e.workers.at(-1);
  old.reply(e.inspection(120)); old.onerror({ message: 'retired error' }); current.reply(e.inspection(24));
  await Promise.all([a, b]); assert.equal(e.api.state.source.fps, 24); noWorkerResources(e);
});
test('rejected fallback play clears its frame callback and timer', async () => {
  const e = environment(), frames = frameFallback(e);
  e.el('sourcePreview').play = () => Promise.reject(new Error('autoplay denied'));
  const { loading } = await failedInspection(e); await loading;
  assert.equal(frames.size, 0); assert(![...e.timers.values()].some(x => x.ms === 2600));
  assert.equal(e.api.state.inspecting, false); assert.equal(e.el('mobileCompressButton').disabled, false); noWorkerResources(e);
});
test('current worker ignores wrong reply ID but accepts own ID', async () => {
  const e = environment(); await e.ready(); const p = e.api.compress(); await flush(); const worker = e.workers.at(-1);
  worker.onmessage({ data: { id: worker.message.id + 99, ok: true, data: new Uint8Array([9]).buffer } }); await flush();
  assert.equal(e.api.state.outputFile, null); assert.equal(e.api.state.pending.size, 1);
  worker.reply(new Uint8Array([1,2]).buffer); await p; assert.equal(e.api.state.outputFile.size, 2); noWorkerResources(e);
});
test('retirement handles later rejected play promise without preview mutation', async () => {
  const e = environment(), frames = frameFallback(e), playback = deferred(); e.el('sourcePreview').play = () => playback.promise;
  const { loading: a } = await failedInspection(e); const b = e.api.selectFile(e.fixture('beta.mp4')); e.metadata(); await flush();
  e.workers.at(-1).reply(e.inspection(60)); await b; e.el('sourcePreview').currentTime = 3;
  const pauses = e.el('sourcePreview').pauses; playback.reject(new Error('retired source abort')); await a;
  assert.equal(e.el('sourcePreview').currentTime, 3); assert.equal(e.el('sourcePreview').pauses, pauses);
  assert.equal(frames.size, 0); assert.equal(e.api.state.source.fps, 60); noWorkerResources(e);
});


// Completed-output actions operate on synthetic encoded bytes, never real media.
async function finishOutput(e, codec = 'h264') {
  await e.ready();
  e.el('codecSelect').value = codec; e.el('codecSelect').dispatch('change');
  e.el('outputNameInput').value = 'before';
  const compression = e.api.compress(); await flush();
  e.workers.at(-1).reply(new Uint8Array([1, 2, 3, 254]).buffer); await compression;
}
function resultSnapshot(e) {
  return { file: e.api.state.outputFile, blob: e.api.state.outputBlob, url: e.api.state.outputUrl,
    preview: e.el('resultPreview').src, workers: e.workers.length, urls: [...e.urls.keys()],
    reduction: e.api.state.outputReduction,
    stats: ['resultOriginalSize', 'resultOutputSize', 'resultSavings', 'resultElapsed'].map(id => e.el(id).textContent) };
}
function assertOutputUnchanged(e, before, sameFile = true) {
  const after = resultSnapshot(e);
  if (sameFile) assert.equal(after.file, before.file);
  for (const key of ['blob', 'url', 'preview', 'workers', 'reduction']) assert.equal(after[key], before[key], key);
  assert.deepEqual(after.urls, before.urls); assert.deepEqual(after.stats, before.stats);
}
function submitRename(e, value) {
  e.el('renameInput').value = value; e.el('renameForm').dispatch('submit');
}

test('rename controls have an accessible form and a non-editable actual extension', () => {
  assert.match(html, /<button[^>]*id="renameButton"[^>]*type="button"/);
  assert.match(html, /<dialog[^>]*id="renameDialog"[^>]*aria-labelledby="renameTitle"/);
  assert.match(html, /<form[^>]*id="renameForm"/);
  assert.match(html, /<label[^>]*for="renameInput"/);
  assert.match(html, /<input[^>]*id="renameInput"[^>]*maxlength="180"[^>]*aria-describedby="renameHint"/);
  assert.match(html, /<span[^>]*id="renameExtension"/);
  assert.match(html, /<button[^>]*id="renameApplyButton"[^>]*type="submit"/);
});
for (const codec of ['h264', 'vp9']) for (const language of ['en', 'ja']) {
  test(`completed ${codec} rename preserves encoded output and updates Save and Share: ${language}`, async () => {
    const e = environment(); await finishOutput(e, codec); e.api.state.language = language;
    const before = resultSnapshot(e), ext = codec === 'vp9' ? '.webm' : '.mp4';
    e.el('codecSelect').value = codec === 'vp9' ? 'h264' : 'vp9'; e.el('codecSelect').dispatch('change');
    e.el('outputNameInput').value = 'next-run';
    e.el('renameButton').click();
    assert.equal(e.el('renameDialog').open, true);
    assert.equal(e.el('renameInput').value, 'before'); assert.equal(e.el('renameExtension').textContent, ext);
    assert.equal(e.el('renameInput').focused, true); assert.equal(e.el('renameInput').selected, true);
    const name = language === 'ja' ? '共有用動画' : 'shared-video';
    submitRename(e, name + (codec === 'vp9' ? '.MP4' : '.WEBM'));
    const file = e.api.state.outputFile;
    assert.equal(e.el('renameDialog').open, false); assert.notEqual(file, before.file);
    assert.equal(file.name, name + ext); assert.equal(e.el('resultName').textContent, file.name);
    assert.equal(file.type, before.file.type); assert.equal(file.size, before.file.size);
    assert.equal(file.lastModified, before.file.lastModified);
    assert.deepEqual([...new Uint8Array(await file.arrayBuffer())], [1, 2, 3, 254]);
    assert.equal(e.el('outputNameInput').value, 'next-run'); assertOutputUnchanged(e, before, false);
    assert.equal(e.el('toastRegion').children.at(-1).textContent,
      language === 'ja' ? '圧縮結果のファイル名を変更しました。' : 'Result file renamed.');
    e.el('downloadButton').click(); assert.equal(e.context.document.body.children.at(-1).download, name + ext);
    let shared; e.context.navigator.canShare = () => true; e.context.navigator.share = async data => { shared = data; };
    await e.api.share(); assert.equal(shared.files[0], file); assert.equal(shared.title, name + ext);
    e.el('renameButton').click(); assert.equal(e.el('renameInput').value, name);
    submitRename(e, 'again'); assert.equal(e.api.state.outputFile.name, 'again' + ext);
    assertOutputUnchanged(e, before, false);
  });
}
for (const action of ['cancel', 'close', 'escape', 'backdrop']) {
  test(`rename ${action} discards the draft and preserves the result`, async () => {
    const e = environment(); await finishOutput(e); const before = resultSnapshot(e);
    const toasts = e.el('toastRegion').children.length;
    e.el('renameButton').click(); e.el('renameInput').value = 'discard';
    if (action === 'cancel') e.el('renameCancelButton').click();
    if (action === 'close') e.el('renameCloseButton').click();
    if (action === 'escape') e.el('renameDialog').dispatch('cancel');
    if (action === 'backdrop') e.el('renameDialog').click();
    assert.equal(e.el('renameDialog').open, false); assertOutputUnchanged(e, before);
    submitRename(e, 'late-submit'); assertOutputUnchanged(e, before);
    assert.equal(e.el('toastRegion').children.length, toasts);
    e.el('renameButton').click(); assert.equal(e.el('renameInput').value, 'before');
  });
}
for (const value of ['', '   ', '.MP4', '... ', 'before', 'before.webm']) {
  test(`empty or unchanged normalized rename retains the original File: ${JSON.stringify(value)}`, async () => {
    const e = environment(); await finishOutput(e); const before = resultSnapshot(e);
    const toasts = e.el('toastRegion').children.length;
    e.el('renameButton').click(); submitRename(e, value);
    assertOutputUnchanged(e, before); assert.equal(e.el('renameDialog').open, false);
    assert.equal(e.el('toastRegion').children.length, toasts);
  });
}
test('filename normalization is shared with next-run naming and remains plain text', async () => {
  const e = environment(); await finishOutput(e);
  for (const [input, expected] of [
    ['  folder/name:*?"<>|clip.WEBM  ', 'folder-name-clip'],
    ['<b>hello</b>... ', '-b-hello-b-'], ['日本語の動画.MP4', '日本語の動画'],
    ['x'.repeat(190), 'x'.repeat(180)], ['x'.repeat(179) + '. rest', 'x'.repeat(179)]
  ]) {
    e.el('renameButton').click(); submitRename(e, input);
    assert.equal(e.api.state.outputFile.name, expected + '.mp4');
    assert.equal(e.el('resultName').textContent, expected + '.mp4');
    e.el('outputNameInput').value = input; e.el('outputNameInput').dispatch('blur');
    assert.equal(e.el('outputNameInput').value, expected);
  }
});
test('rename guards an absent output and an active compression', async () => {
  const e = environment(); e.el('renameButton').click(); assert.notEqual(e.el('renameDialog').open, true);
  await finishOutput(e); const before = resultSnapshot(e);
  e.api.state.processing = true; e.el('renameButton').click(); assert.notEqual(e.el('renameDialog').open, true);
  assertOutputUnchanged(e, before); e.api.state.processing = false;
});
test('rename identity guard rejects a different result even when the name matches', async () => {
  const e = environment(); await finishOutput(e); e.el('renameButton').click();
  const old = e.api.state.outputFile;
  e.api.state.outputFile = new File([old], old.name, { type: old.type, lastModified: old.lastModified });
  const before = resultSnapshot(e); submitRename(e, 'stale');
  assertOutputUnchanged(e, before); assert.equal(e.el('renameDialog').open, false);
});
for (const action of ['clear', 'replace', 'recompress']) {
  test(`output ${action} closes rename and prevents stale submission`, async () => {
    const e = environment(); await finishOutput(e); e.el('renameButton').click();
    let pending;
    if (action === 'clear') e.api.clearFile();
    if (action === 'replace') {
      pending = e.api.selectFile(e.fixture('replacement.mp4')); e.metadata(); await flush();
      e.workers.at(-1).reply(e.inspection()); await pending;
    }
    if (action === 'recompress') {
      pending = e.api.compress(); await flush();
      e.workers.at(-1).reply(new Uint8Array([9, 8]).buffer); await pending;
    }
    assert.equal(e.el('renameDialog').open, false);
    const before = resultSnapshot(e); submitRename(e, 'stale'); assertOutputUnchanged(e, before);
  });
}
for (const language of ['en', 'ja']) test(`Save click emits one download-start message: ${language}`, async () => {
  const e = environment(); await finishOutput(e); e.api.state.language = language;
  const before = e.el('toastRegion').children.length;
  e.el('downloadButton').click();
  assert.equal(e.el('toastRegion').children.length - before, 1);
  assert.equal(e.el('toastRegion').children.at(-1).textContent, language === 'ja' ? '保存を開始しました。' : 'Download started.');
  assert.equal(e.context.document.body.children.at(-1).download, 'before.mp4');
});
test('explicit silent download and unsupported Share preserve feedback behavior', async () => {
  const e = environment(); await finishOutput(e);
  const before = e.el('toastRegion').children.length;
  e.api.download(true); assert.equal(e.el('toastRegion').children.length, before);
  await e.api.share(); assert.equal(e.el('toastRegion').children.length, before + 1);
  assert.equal(e.el('toastRegion').children.at(-1).textContent, 'File sharing is unavailable, so the download was started.');
});
test('Save without output and aborted native Share have no side effects', async () => {
  const e = environment(); e.el('downloadButton').click();
  assert.equal(e.context.document.body.children.length, 0); assert.equal(e.el('toastRegion').children.length, 0);
  await finishOutput(e); const before = e.el('toastRegion').children.length;
  const children = e.context.document.body.children.length;
  e.context.navigator.share = async () => { const error = new Error('cancelled'); error.name = 'AbortError'; throw error; };
  await e.api.share(); assert.equal(e.el('toastRegion').children.length, before);
  assert.equal(e.context.document.body.children.length, children);
});
for (const value of ['clip.mp4.webm', 'clip.mp4.']) {
  test(`untouched Rename preserves a basename that still ends in a codec suffix: ${value}`, async () => {
    const e = environment(); await finishOutput(e);
    e.el('renameButton').click(); submitRename(e, value);
    assert.equal(e.api.state.outputFile.name, 'clip.mp4.mp4');
    const before = resultSnapshot(e), toasts = e.el('toastRegion').children.length;
    e.el('renameButton').click(); assert.equal(e.el('renameInput').value, 'clip.mp4');
    e.el('renameForm').dispatch('submit');
    assertOutputUnchanged(e, before); assert.equal(e.el('toastRegion').children.length, toasts);
  });
}

// Header regressions execute the app's actual language click handler.
test('header language action is localized and survives repeated round trips', () => {
  const e = environment();
  const before = { file: e.api.state.file, codec: e.el('codecSelect').value, bitrate: e.el('bitrateInput').value };
  for (const language of ['en', 'ja', 'en', 'ja', 'en']) {
    const ja = language === 'ja';
    assert.equal(e.api.state.language, language);
    assert.equal(e.el('languageLabel').textContent, ja ? 'EN' : 'JA');
    assert.equal(e.el('languageButton').getAttribute('aria-label'), ja ? '英語に切り替え' : 'Switch to Japanese');
    assert.equal(e.el('languageButton').title, ja ? '英語に切り替え' : 'Switch to Japanese');
    assert.equal(e.el('helpButton').getAttribute('aria-label'), ja ? 'ヘルプ' : 'Help');
    assert.equal(e.el('helpButton').title, ja ? 'ヘルプ' : 'Help');
    assert.equal(e.api.t('privacyShort'), ja ? '完全ローカル処理' : 'Fully local processing');
    assert.deepEqual({ file: e.api.state.file, codec: e.el('codecSelect').value, bitrate: e.el('bitrateInput').value }, before);
    e.el('languageButton').click();
  }
});
test('Japanese fallback header names its English target before initialization', () => {
  const button = html.match(/<button\b[^>]*id="languageButton"[^>]*>/)[0];
  assert.match(button, /aria-label="英語に切り替え"/);
  assert.match(button, /title="英語に切り替え"/);
});
