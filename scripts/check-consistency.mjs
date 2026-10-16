#!/usr/bin/env node
/**
 * Repository invariant checks — no browser, no dependencies.
 *
 *  1. Version: the userscript @version must be mentioned in README.md and
 *     README.en.md (the panel reads its version from GM_info, so those are the
 *     only places that still need a manual bump).
 *  2. Privacy contract: the userscript must never contain network or
 *     automation primitives. The README promises a purely client-side filter.
 *
 * Run locally:  node scripts/check-consistency.mjs
 */
import { readFileSync } from 'node:fs';

const root = process.argv[2] || process.cwd();
const usPath = `${root}/twitterprnblocker.user.js`;
const us = readFileSync(usPath, 'utf8');

let failed = false;
const fail = (msg) => { failed = true; console.error(`FAIL: ${msg}`); };

// 1. Version consistency
const versionMatch = us.match(/\/\/\s*@version\s+([0-9]+\.[0-9]+\.[0-9]+)/);
if (!versionMatch) {
  fail('@version not found in userscript metadata block');
}
const version = versionMatch && versionMatch[1];
if (version) {
  for (const readme of ['README.md', 'README.en.md']) {
    const text = readFileSync(`${root}/${readme}`, 'utf8');
    if (!text.includes(`v${version}`)) {
      fail(`${readme} does not mention the current version "v${version}"`);
    }
  }
}

// 2. Privacy contract
const forbidden = [
  [/fetch\s*\(/, 'fetch()'],
  [/XMLHttpRequest/, 'XMLHttpRequest'],
  [/WebSocket/, 'WebSocket'],
  [/sendBeacon/, 'navigator.sendBeacon'],
  [/EventSource/, 'EventSource'],
  [/\bimport\s*\(/, 'dynamic import()']
];
for (const [re, label] of forbidden) {
  if (re.test(us)) fail(`forbidden ${label} in twitterprnblocker.user.js (privacy contract)`);
}

if (failed) process.exit(1);
console.log(`OK: version ${version} consistent in both READMEs; no forbidden network APIs.`);
