'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/index.template.html'),'utf8');
test('hide only the informational footer at the existing 640 px action-bar breakpoint',()=>{
  assert.ok(source.includes('@media (max-width: 640px) { main > .footer { display: none; } }'));
  assert.match(source,/id="mobileBar"/);
});
test('existing populated app version moves to the end of Help without changing header version',()=>{
  const help=source.match(/<dialog id="helpDialog"[\s\S]*?<\/dialog>/)[0];
  assert.equal((source.match(/id="versionText"/g)||[]).length,1);
  assert.match(help,/<p class="help-build"><span id="versionText">Local Video Compressor<\/span><\/p><\/div><\/dialog>$/);
  assert.ok(help.indexOf('id="versionText"')>help.indexOf('id="ffmpegSourceLink"'));
  assert.doesNotMatch(source.match(/<footer\b[\s\S]*?<\/footer>/)[0],/versionText/);
  assert.match(source,/els\.versionBadge\.textContent=`v\$\{version\}`/);
});
