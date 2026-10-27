'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const sourcePath = path.join(__dirname, '../components/ui-conventions.js');
const source = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';
const context = { URL, module: { exports: {} } };
vm.runInNewContext(source, context);
const ui = context.module.exports;
function storage(values = {}) {
  const data = new Map(Object.entries(values));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data };
}
test('language resolution respects URL, shared, ordered legacy, navigator, fallback without writes', () => {
  assert.equal(typeof ui.resolveLanguage, 'function', 'language resolver must be implemented');
  const s = storage({ 'browser-kitty:ui-language:v1': 'en', old: 'ja', older: 'en' });
  assert.equal(ui.resolveLanguage({ url: 'https://example.test/?lang=ja', storage: s, legacyKeys: ['old'], languages: ['en-US'] }), 'ja');
  assert.equal(ui.resolveLanguage({ url: '?lang=invalid', storage: s, legacyKeys: ['old'], languages: ['ja-JP'] }), 'en');
  s.data.delete('browser-kitty:ui-language:v1');
  assert.equal(ui.resolveLanguage({ url: '', storage: s, legacyKeys: ['old', 'older'], languages: ['en-US'] }), 'ja');
  assert.equal(s.data.has('browser-kitty:ui-language:v1'), false, 'reading legacy cannot promote it');
  assert.equal(ui.resolveLanguage({ url: '', storage: null, languages: ['fr', 'en-US', 'ja-JP'] }), 'en');
  assert.equal(ui.resolveLanguage({ url: '', storage: null, languages: ['fr', 'ja-JP', 'en-US'] }), 'ja');
  assert.equal(ui.resolveLanguage({ url: '', storage: null, languages: ['fr'] }), 'en');
});
test('throwing browser storage getters and read methods degrade safely', () => {
  const globals = { URL, navigator: { languages: ['ja-JP'] } };
  Object.defineProperty(globals, 'localStorage', { get() { throw Error('denied'); } });
  vm.runInNewContext(source, globals);
  assert.equal(typeof globals.BrowserKittyUI?.resolveLanguage, 'function');
  assert.equal(globals.BrowserKittyUI.resolveLanguage(), 'ja');
  assert.equal(globals.BrowserKittyUI.chooseLanguage('en').persisted, false);
  assert.equal(ui.resolveLanguage({ storage: { getItem() { throw Error('denied'); } }, languages: ['ja'] }), 'ja');
});
test('explicit language choice writes only shared key and replaces existing URL lang without history entries', () => {
  assert.equal(typeof ui.chooseLanguage, 'function');
  const s = storage({ old: 'ja' });
  const calls = [];
  const result = ui.chooseLanguage('en', { storage: s, url: 'https://example.test/a?x=1&lang=ja#part', history: { state: { keep: 1 }, replaceState(...args) { calls.push(args); } } });
  assert.equal(result.language, 'en'); assert.equal(result.persisted, true); assert.equal(result.urlUpdated, true);
  assert.equal(s.data.get('old'), 'ja'); assert.equal(s.data.get('browser-kitty:ui-language:v1'), 'en');
  assert.equal(calls[0][2], 'https://example.test/a?x=1&lang=en#part');
  assert.equal(calls[0][0].keep, 1);
  calls.length = 0;
  assert.equal(ui.chooseLanguage('ja', { storage: null, url: 'https://example.test/', history: { replaceState() { calls.push(1); } } }).urlUpdated, false);
  assert.equal(calls.length, 0);
  assert.equal(ui.chooseLanguage('ja', { storage: { setItem() { throw Error('full'); } }, url: '?lang=en', history: { replaceState() { throw Error('denied'); } } }).language, 'ja');
  assert.throws(() => ui.chooseLanguage('fr'), /language/i);
});
function element() {
  const attrs = {};
  return { attrs, disabled: false, textContent: '', set innerHTML(value) { throw Error('unsafe HTML'); }, setAttribute(key, value) { attrs[key] = String(value); }, removeAttribute(key) { delete attrs[key]; } };
}
test('button transitions preserve labels and disable duplicate busy or stopping actions', () => {
  assert.equal(typeof ui.setButtonState, 'function');
  const b = element(); b.textContent = 'Save <file>';
  for (const [state, disabled] of [['ready', false], ['unavailable', true], ['busy', true], ['stopping', true], ['ready', false]]) {
    ui.setButtonState(b, state); assert.equal(b.disabled, disabled); assert.equal(b.attrs['data-bk-state'], state); assert.equal(b.textContent, 'Save <file>');
    assert.equal(b.attrs['aria-busy'], state === 'busy' || state === 'stopping' ? 'true' : undefined);
  }
  assert.throws(() => ui.setButtonState(b, 'saved'), /state/i);
});
test('save status renders literal text and reflects confirmed state only', () => {
  assert.equal(typeof ui.setSaveStatus, 'function');
  const e = element();
  ui.setSaveStatus(e, { mode: 'autosave', state: 'dirty', language: 'en' }); assert.equal(e.textContent, 'Unsaved changes');
  ui.setSaveStatus(e, { mode: 'autosave', state: 'saving', language: 'en' }); assert.equal(e.textContent, 'Saving…');
  ui.setSaveStatus(e, { mode: 'autosave', state: 'saved', language: 'en', time: '<img onerror=alert(1)>' }); assert.equal(e.textContent, 'Saved in this browser · <img onerror=alert(1)>');
  ui.setSaveStatus(e, { mode: 'autosave', state: 'error', language: 'en' }); assert.equal(e.textContent, 'Could not save in this browser');
  ui.setSaveStatus(e, { mode: 'session', state: 'saved', language: 'en' }); assert.equal(e.textContent, 'Your work will be lost when this tab closes');
  ui.setSaveStatus(e, { mode: 'manual', state: 'saved', language: 'en' }); assert.match(e.textContent, /not saved automatically/);
  assert.equal(e.attrs.role, 'status'); assert.equal(e.attrs['aria-live'], 'polite');
  assert.equal(ui.text('saved', 'ja', { time: '<b>14:32</b>' }), 'このブラウザーに保存済み・<b>14:32</b>');
  assert.equal(ui.text('saved', 'en', { time: '$&' }), 'Saved in this browser · $&');
});
