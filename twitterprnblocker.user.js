// ==UserScript==
// @name         Twitter Prn Blocker (X uyumlu yerel filtre)
// @namespace    https://github.com/akamusti/twitterprnblocker
// @version      0.2.1
// @description  X akisinda +18 / spam icerikleri SADECE senin tarayicinda gizler. Harici sunucuya veri gondermez, otomatik block/mute/like/follow yapmaz, X API kullanmaz.
// @author       akamusti
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @license      GPL-3.0-only
// @homepageURL  https://github.com/akamusti/twitterprnblocker
// ==/UserScript==

/*
 * UYUM NOTU (X Kurallari - Nisan 2026 Automation Rules):
 * -------------------------------------------------------
 * Bu script BILEREK sunlari YAPMAZ (yasak olduklari icin):
 *  1. Otomatik block / mute / unfollow / report tiklamaz, X API cagirmaz.
 *  2. Tweet verisini herhangi bir sunucuya gondermez, toplamaz, aynalamaz
 *     (Nitter / Bright Data davalarinin konusu bu).
 *  3. Otomatik reply / DM / like / retweet atmaz.
 *  4. Rate limit atlatma, giris duvari asma, token kullanma YOK.
 *
 * Yaptigi TEK sey: zaten sana gosterilmis tweet kartini (article)
 * senin ekraninda blur/gizleme ile kapatmak. AdBlock mantigi.
 * Tum liste ve ayarlar SADECE senin tarayicinda saklanir.
 */

(function () {
  'use strict';

  const STORE_KEYS = {
    keywords: 'tpb_keywords',
    accounts: 'tpb_accounts',
    accountsVersion: 'tpb_accounts_version',
    hideCompletely: 'tpb_hide_completely',
  };

  const DEFAULT_KEYWORDS = [
    'onlyfans', 'fansly', 'nsfw', 'porn', 'xxx', 'hentai', 'escort',
    '+18', 'ifsa', 'ifşa',
    '#nsfw', '#onlyfans', '#porn',
  ];

  const DEFAULT_ACCOUNTS = [
    'roshytv',
    'javcodelust',
    'xlovelyhub',
    'pornhub',
    'onlyfans',
  ];

  const DEFAULTS_VERSION = 2;

  function load(key, fallback) {
    try {
      if (typeof GM_getValue === 'function') {
        const v = GM_getValue(key, null);
        if (v !== null && v !== undefined) return v;
      }
    } catch (_) { /* yoksay */ }
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (_) { /* yoksay */ }
    return fallback;
  }

  function save(key, value) {
    try {
      if (typeof GM_setValue === 'function') GM_setValue(key, value);
    } catch (_) { /* yoksay */ }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) { /* yoksay */ }
  }

  let keywords = load(STORE_KEYS.keywords, DEFAULT_KEYWORDS);
  let blockedAccounts = load(STORE_KEYS.accounts, DEFAULT_ACCOUNTS);
  let hideCompletely = load(STORE_KEYS.hideCompletely, false);
  let hiddenCount = 0;

  const norm = (s) => (s || '').toLocaleLowerCase('tr');

  function getKeywordList() {
    return (Array.isArray(keywords) ? keywords : []).map(norm).filter(Boolean);
  }

  function getAccountList() {
    return (Array.isArray(blockedAccounts) ? blockedAccounts : [])
      .map((a) => norm(a).replace(/^@/, '').trim())
      .filter(Boolean);
  }

  try {
    if (!Array.isArray(blockedAccounts)) blockedAccounts = [];
    const appliedVersion = load(STORE_KEYS.accountsVersion, 0);
    if (appliedVersion < DEFAULTS_VERSION) {
      const have = new Set(getAccountList());
      let changed = false;
      for (const a of DEFAULT_ACCOUNTS) {
        const n = norm(a).replace(/^@/, '').trim();
        if (n && !have.has(n)) {
          blockedAccounts.push(n);
          have.add(n);
          changed = true;
        }
      }
      if (changed) save(STORE_KEYS.accounts, blockedAccounts);
      save(STORE_KEYS.accountsVersion, DEFAULTS_VERSION);
    }
  } catch (_) { /* yoksay, liste varsayilanlarla calismaya devam eder */ }

  function getTweetText(article) {
    const textEl = article.querySelector('div[data-testid="tweetText"]');
    return textEl ? textEl.innerText || '' : article.innerText || '';
  }

  function getTweetAuthor(article) {
    const links = article.querySelectorAll('a[href^="/"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/^\/([A-Za-z0-9_]{1,15})(\/|$)/);
      if (m) {
        const bad = ['home', 'explore', 'notifications', 'messages', 'search', 'settings', 'i'];
        if (!bad.includes(m[1].toLowerCase())) return m[1].toLowerCase();
      }
    }
    const userEl = article.querySelector('div[data-testid="User-Name"]');
    if (userEl) {
      const t = userEl.innerText || '';
      const m2 = t.match(/@([A-Za-z0-9_]{1,15})/);
      if (m2) return m2[1].toLowerCase();
    }
    return '';
  }

  function matchReason(article) {
    const text = norm(getTweetText(article));
    const author = getTweetAuthor(article);

    if (author && getAccountList().includes(author)) {
      return 'hesap: @' + author;
    }
    for (const kw of getKeywordList()) {
      if (kw && text.includes(kw)) return 'kelime: ' + kw;
    }
    return null;
  }

  const STYLE_ID = 'tpb-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = [
      '.tpb-blurred { filter: blur(14px); pointer-events: none; user-select: none; }',
      '.tpb-wrap { position: relative; }',
      '.tpb-badge {',
      '  position: absolute; top: 8px; right: 8px; z-index: 9999;',
      '  background: #0f1419; color: #fff; font-size: 12px; font-weight: 700;',
      '  padding: 6px 10px; border-radius: 9999px; cursor: pointer;',
      '  border: 1px solid #536471; font-family: system-ui, sans-serif;',
      '}',
      '.tpb-panel {',
      '  position: fixed; bottom: 70px; left: 16px; z-index: 10000; width: 300px;',
      '  background: #000; color: #e7e9ea; border: 1px solid #2f3336; border-radius: 16px;',
      '  padding: 12px; font-family: system-ui, sans-serif; font-size: 13px;',
      '  box-shadow: 0 4px 24px rgba(0,0,0,.5);',
      '}',
      '.tpb-panel textarea { width: 100%; height: 56px; background: #16181c; color: #e7e9ea;',
      '  border: 1px solid #2f3336; border-radius: 8px; padding: 6px; font-size: 12px; }',
      '.tpb-panel button { background: #1d9bf0; color: #fff; border: 0; border-radius: 9999px;',
      '  padding: 6px 12px; font-weight: 700; cursor: pointer; margin-top: 6px; }',
      '.tpb-fab {',
      '  position: fixed; bottom: 16px; left: 16px; z-index: 10000;',
      '  background: #1d9bf0; color: #fff; border: 0; border-radius: 9999px;',
      '  padding: 10px 16px; font-weight: 800; cursor: pointer;',
      '  font-family: system-ui, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.4);',
      '}',
    ].join('\n');
    document.head.appendChild(st);
  }

  function hideArticle(article, reason) {
    if (article.dataset.tpbDone === '1') return;
    article.dataset.tpbDone = '1';
    article.dataset.tpbReason = reason;
    hiddenCount += 1;
    updateFab();

    if (hideCompletely) {
      article.style.display = 'none';
      return;
    }
    article.classList.add('tpb-wrap');
    const inner = article;
    inner.classList.add('tpb-blurred');

    const badge = document.createElement('button');
    badge.className = 'tpb-badge';
    badge.type = 'button';
    badge.textContent = '🔒 gizlendi (' + reason + ') — goster';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      inner.classList.toggle('tpb-blurred');
      badge.textContent = inner.classList.contains('tpb-blurred')
        ? '🔒 gizlendi (' + reason + ') — goster'
        : '🙈 tekrar gizle';
    });
    article.appendChild(badge);
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const articles = scope.querySelectorAll
      ? scope.querySelectorAll('article[data-testid="tweet"]')
      : [];
    for (const a of articles) {
      if (a.dataset.tpbDone === '1') continue;
      const reason = matchReason(a);
      if (reason) hideArticle(a, reason);
    }
  }

  let fab = null;
  function updateFab() {
    if (fab) fab.textContent = '🔒 TPB (' + hiddenCount + ')';
  }

  function buildUI() {
    ensureStyle();

    fab = document.createElement('button');
    fab.className = 'tpb-fab';
    fab.type = 'button';
    fab.textContent = '🔒 TPB (0)';
    fab.title = 'Twitter Prn Blocker — sadece yerel filtre';
    fab.addEventListener('click', togglePanel);
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.className = 'tpb-panel';
    panel.id = 'tpb-panel';
    panel.style.display = 'none';
    panel.innerHTML =
      '<b>🔒 Twitter Prn Blocker</b><br>' +
      '<span style="color:#71767b">Sadece senin ekraninda gizler. X’e istek atmaz.</span><br><br>' +
      '<label>Kelimeler (virgulle ayir)</label><br>' +
      '<textarea id="tpb-kw"></textarea><br>' +
      '<label>Hesaplar (virgulle ayir, @ siz)</label><br>' +
      '<textarea id="tpb-acc"></textarea><br>' +
      '<label><input type="checkbox" id="tpb-hide"> Tamamen gizle (blur yerine yok et)</label><br>' +
      '<button id="tpb-save" type="button">Kaydet</button> ' +
      '<span id="tpb-count" style="color:#71767b"></span>';
    document.body.appendChild(panel);

    panel.querySelector('#tpb-save').addEventListener('click', () => {
      const kwRaw = panel.querySelector('#tpb-kw').value || '';
      const accRaw = panel.querySelector('#tpb-acc').value || '';
      keywords = kwRaw.split(',').map((s) => s.trim()).filter(Boolean);
      blockedAccounts = accRaw.split(',').map((s) => s.trim()).filter(Boolean);
      hideCompletely = panel.querySelector('#tpb-hide').checked;
      save(STORE_KEYS.keywords, keywords);
      save(STORE_KEYS.accounts, blockedAccounts);
      save(STORE_KEYS.hideCompletely, hideCompletely);
      document.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
        delete a.dataset.tpbDone;
      });
      hiddenCount = 0;
      updateFab();
      scan(document);
      refreshPanel();
    });
  }

  function togglePanel() {
    const p = document.getElementById('tpb-panel');
    if (!p) return;
    const open = p.style.display !== 'none';
    p.style.display = open ? 'none' : 'block';
    if (!open) refreshPanel();
  }

  function refreshPanel() {
    const p = document.getElementById('tpb-panel');
    if (!p) return;
    p.querySelector('#tpb-kw').value = (keywords || []).join(', ');
    p.querySelector('#tpb-acc').value = (blockedAccounts || []).join(', ');
    p.querySelector('#tpb-hide').checked = !!hideCompletely;
    p.querySelector('#tpb-count').textContent = ' gizlenen: ' + hiddenCount;
  }

  function init() {
    buildUI();
    scan(document);
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches && n.matches('article[data-testid="tweet"]')) {
            const reason = matchReason(n);
            if (reason) hideArticle(n, reason);
          } else if (n.querySelectorAll) {
            scan(n);
          }
        }
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
