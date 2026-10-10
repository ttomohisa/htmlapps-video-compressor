const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
let html=fs.readFileSync(process.argv[2]||path.join(__dirname,'../src/index.template.html'),'utf8');
const payload=html.match(/<script\s+id="self-extract-payload"\s+type="application\/octet-stream">([A-Za-z0-9+/=\r\n]+)<\/script>/);
if(payload)html=require('node:zlib').gunzipSync(Buffer.from(payload[1].replace(/\s/g,''),'base64')).toString('utf8');
test('native modals lock the document and body only while a modal is open',()=>{
 assert.match(html,/html:has\(dialog:modal\),body:has\(dialog:modal\)\{overflow:hidden\}/);
});
test('preserve the bounded open-only flex shell and scrollable body',()=>{
 assert.match(html,/dialog\[open\]\{display:flex;flex-direction:column\}/);
 assert.match(html,/\.help-body\{min-height:0;flex:1;[^}]*overflow:auto;overscroll-behavior:contain/);
 assert.match(html,/\.help-head\{[^}]*flex:none/);
});

test('local processing badge uses the decorative shared shield before its truthful label', () => {
  const badge=html.match(/<div class="privacy-chip">([\s\S]*?)<\/div>/)[1];
  assert.match(badge, /<svg[^>]*aria-hidden="true"[^>]*><path d="M12 3 5 6v5c0 4\.6 2\.8 8 7 10 4\.2-2 7-5\.4 7-10V6z"\/><path d="m9 12 2 2 4-5"\/><\/svg><span data-i18n="privacyShort">/);
});
