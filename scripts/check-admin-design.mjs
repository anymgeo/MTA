import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../mta.admin/package.json', import.meta.url));
const postcss = require('postcss');
const css = readFileSync(new URL('../mta.admin/app/admin-design-system.css', import.meta.url), 'utf8');
const tree = postcss.parse(css);
const layout = readFileSync(new URL('../mta.admin/app/layout.tsx', import.meta.url), 'utf8');
assert(layout.indexOf("import './admin-design-system.css'") > layout.indexOf("import './cms.css'"), 'Shared theme must follow legacy styles');

const tokens = new Map();
tree.walkRules(':root', rule => rule.walkDecls(declaration => tokens.set(declaration.prop, declaration.value)));
for (const token of ['--ui-text', '--ui-muted', '--ui-accent', '--ui-success', '--ui-warning', '--ui-danger', '--ui-focus', '--ui-card-shadow']) {
  assert(tokens.has(token), `Missing token: ${token}`);
}
assert.equal(tokens.get('--ui-radius'), '11px');
assert(tokens.get('--ui-card-shadow').includes('.025'), 'Card elevation should remain subtle');

function luminance(hex) {
  const channels = hex.replace('#', '').match(/../g).map(channel => parseInt(channel, 16) / 255);
  const linear = channels.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}
function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
for (const [foreground, background] of [
  ['--ui-text', '--ui-surface'], ['--ui-muted', '--ui-surface'], ['--ui-accent', '--ui-surface'],
  ['--ui-success', '--ui-success-soft'], ['--ui-warning', '--ui-warning-soft'], ['--ui-danger', '--ui-danger-soft'],
]) {
  const ratio = contrast(tokens.get(foreground), tokens.get(background));
  assert(ratio >= 4.5, `${foreground}/${background} contrast ${ratio.toFixed(2)} is too low`);
}
for (const selector of [
  '.p-inputtext', '.p-inputtextarea', '.p-dropdown', '.p-multiselect', 'input[type=checkbox]',
  '.admin-switch', '.p-inputswitch', '.p-button-danger', '.p-dropdown-panel', '.p-dropdown-item.p-highlight',
  '.cms-upload', '.map-upload-button', '.map-metadata', '.news-panel', '.premium-card', '.cms-fields',
  '.cms-row', '.cms-accordion', '.map-properties-card', '.stat-card', '.nav-item.active',
]) {
  assert(css.includes(selector), `Missing shared styling coverage: ${selector}`);
}
assert(css.includes('prefers-reduced-motion: reduce'));
assert(css.includes('forced-colors: active'));
assert(css.includes('.p-dropdown-panel .p-dropdown-item.p-highlight::after'));
assert(css.includes('background: #fff !important'), 'Portalled dropdowns must remain opaque');
assert(css.includes('.p-button .p-button-label'), 'Nested button labels must inherit action contrast');

const faq = readFileSync(new URL('../mta.admin/app/ui/faqs.tsx', import.meta.url), 'utf8');
assert(!faq.includes('<select'), 'FAQ should use the shared dropdown');
assert(faq.includes('scope: e.value ??'), 'Main FAQ selection must remain an empty string, not null');
console.log('PASS: shared admin controls, card elevation, opaque menus, accessible contrast, motion fallbacks, and FAQ values.');
