import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../../index.html', import.meta.url), 'utf8');

// The viewer is a single inline-script document: keep syntax regressions local
// and deterministic without starting a browser.
for (const script of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  new Function(script[1]); // eslint-disable-line no-new-func
}

assert.match(source, /\.stage\s*\{[\s\S]*?overflow:\s*auto;[\s\S]*?overscroll-behavior:\s*contain;/);
assert.match(source, /class="stage-track"/);
assert.match(source, /class="stage-spacer"/);
const iframeRule = source.match(/\n  iframe \{([\s\S]*?)\n  \}/)?.[1];
assert.ok(iframeRule, 'base iframe rule exists');
assert.match(iframeRule, /position:\s*sticky;\s*top:\s*0/);
assert.match(iframeRule, /width:\s*100%;\s*height:\s*var\(--frame-viewport-h,\s*1px\);/);
assert.doesNotMatch(iframeRule, /height:\s*var\(--frame-doc-h/);
assert.match(source, /\.stage-spacer\s*\{[\s\S]*?height:\s*var\(--frame-doc-h,\s*1px\)/);
assert.match(source, /\.stage-spacer\s*\{[\s\S]*?margin-top:\s*calc\(-1 \* var\(--frame-viewport-h,\s*1px\)\)/, 'spacer cancels iframe flow height so scroll range is document minus viewport');
const maxStageScroll = (childScrollHeight, iframeViewportHeight) =>
  Math.max(0, childScrollHeight - iframeViewportHeight);
assert.equal(maxStageScroll(1800, 720), 1080, 'stage range is child height minus iframe viewport');
assert.equal(maxStageScroll(500, 720), 0, 'short documents have no empty tail');

const heightHelper = source.match(/function frameDocumentHeight\(doc\)[\s\S]*?\n}/)?.[0];
assert.ok(heightHelper, 'frame document height helper exists');
const context = {};
vm.createContext(context);
vm.runInContext(heightHelper, context);
assert.equal(context.frameDocumentHeight({
  documentElement: { scrollHeight: 320, offsetHeight: 280 },
  body: { scrollHeight: 640.2, offsetHeight: 610 },
}), 641, 'uses the tallest document metric and rounds upward');
assert.equal(context.frameDocumentHeight({ documentElement: {}, body: {} }), 0, 'empty documents stay collapsed');

assert.match(source, /const resize = new ResizeObserver\(schedule\);[\s\S]*?resize\.observe\(doc\.documentElement\);[\s\S]*?resize\.observe\(doc\.body\);/);
assert.match(source, /const frameBox = new ResizeObserver\(schedule\);[\s\S]*?frameBox\.observe\(stage\);/);
assert.match(source, /doc\.fonts\?\.ready\.then\(schedule\)/);
assert.match(source, /frameHeightCleanup\(\);[\s\S]*?mainEl\.style\.setProperty\('--frame-doc-h', '1px'\);[\s\S]*?stage\.scrollTo\(\{ top: 0, behavior: 'auto' \}\);/);
assert.match(source, /stage\.addEventListener\('scroll',[\s\S]*?frame\.contentWindow\.scrollTo\(/);
assert.match(source, /stageSpacer\.style\.height = height \+ 'px'/);
assert.match(source, /html\[data-shell-stage-scroll\]\{overflow-y:auto!important;scrollbar-width:none!important\}/, 'desktop child keeps html as the programmatic sticky scroll root without a visible scrollbar');
assert.match(source, /html\[data-shell-stage-scroll\] body\{overflow-y:visible!important;scrollbar-width:none!important\}/, 'body cannot become a competing sticky scroll ancestor');
assert.doesNotMatch(source, /html,body\{overflow-y:auto!important/, 'child document no longer assigns scrolling to both root elements');
assert.match(source, /function frameWheelDelta\(e, viewport\)[\s\S]*?e\.deltaMode === 1[\s\S]*?e\.deltaMode === 2/, 'wheel delta modes are normalized before forwarding');
const wheelHelper = source.match(/function frameWheelDelta\(e, viewport\)[\s\S]*?\n}/)?.[0];
assert.ok(wheelHelper, 'frame wheel delta helper exists');
vm.runInContext(wheelHelper, context);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.frameWheelDelta({ deltaMode: 1, deltaX: 2, deltaY: -3 }, 720))),
  { left: 32, top: -48 },
  'line-mode wheel deltas use a stable pixel increment',
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.frameWheelDelta({ deltaMode: 2, deltaX: 0, deltaY: 1 }, 720))),
  { left: 0, top: 720 },
  'page-mode wheel deltas use the stage viewport',
);
assert.match(source, /if \(mobileShell\.matches \|\| e\.ctrlKey \|\| e\.metaKey\) return;/, 'mobile and browser zoom keep their native wheel behavior');
assert.match(source, /doc\.addEventListener\('wheel', redirectFrameWheel, \{ capture: true, passive: false \}\);/, 'wheel input inside the iframe is captured before child scrolling');
assert.match(source, /e\.preventDefault\(\);\s*stage\.scrollBy\(\{ left, top, behavior: 'auto' \}\);/, 'desktop iframe wheel input advances the outer stage');
assert.match(source, /doc\.removeEventListener\('wheel', redirectFrameWheel, true\);/, 'old iframe documents release their wheel bridge');
assert.match(source, /syncShellMode\(\) \{[\s\S]*?applyEmbedBg\(frame\.contentDocument\)/, 'resizing across the mobile breakpoint refreshes the child scroll owner');
assert.match(source, /fixed Agentation toolbar/);
assert.match(source, /function scrollFrameAnchor\(\)[\s\S]*?stage\.scrollTo\(/);
assert.match(source, /frameHeightRefresh\(\);/);

console.log('viewer outer-scroll lifecycle passes');
