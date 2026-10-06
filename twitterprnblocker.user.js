// ==UserScript==
// @name         Twitter Prn Blocker (X uyumlu yerel filtre)
// @namespace    https://github.com/akamusti/twitterprnblocker
// @version      0.3.2
// @description  X akisinda +18 / spam icerikleri SADECE senin tarayicinda gizler. Harici sunucuya veri gondermez, otomatik block/mute/like/follow yapmaz, X API kullanmaz.
// @author       akamusti
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @license      GPL-3.0-only
// @homepageURL  https://github.com/akamusti/twitterprnblocker
// @downloadURL  https://github.com/akamusti/twitterprnblocker/raw/refs/heads/main/twitterprnblocker.user.js
// @updateURL    https://github.com/akamusti/twitterprnblocker/raw/refs/heads/main/twitterprnblocker.user.js
// ==/UserScript==

/*
 * UYUM NOTU (X Kurallari - Yerel Tarayici Filtresi):
 * -------------------------------------------------------
 * Bu script BILEREK sunlari YAPMAZ (yasak olduklari icin):
 *  1. Otomatik block / mute / unfollow / report tiklamaz, X API cagirmaz.
 *  2. Tweet verisini herhangi bir sunucuya gondermez, toplamaz, aynalamaz.
 *  3. Otomatik reply / DM / like / retweet atmaz.
 *  4. Rate limit atlatma, giris duvari asma, token kullanma YOK.
 *
 * Yaptigi TEK sey: sana gosterilmis tweet kartini (article)
 * senin ekraninda CSS ile blur/gizleme ile filtrelemek (AdBlock mantigi).
 * Tum liste ve ayarlar SADECE senin tarayicinda saklanir.
 */

(function () {
  'use strict';

  const STORE_KEYS = {
    keywords: 'tpb_keywords',
    accounts: 'tpb_accounts',
    accountsVersion: 'tpb_accounts_version',
    hideCompletely: 'tpb_hide_completely',
    scanProfiles: 'tpb_scan_profiles',
    cleanZeroWidth: 'tpb_clean_zerowidth',
    fabPosition: 'tpb_fab_pos',
    fabVisible: 'tpb_fab_visible',
  };

  const DEFAULT_KEYWORDS = [
    'onlyfans', 'fansly', 'nsfw', 'porn', 'porno', 'xxx', 'hentai',
    'escort', 'eskort', '+18', '18+', 'ifsa', 'ifşa',
    'sikiş', 'azgın', 'vip kanal', 'arşiv link', 'arsiv link',
    'leaks', 'nudes', 'camgirl', 'sex tape',
    '#nsfw', '#onlyfans', '#porn', '#ifsa', '#ifşa'
  ];

  const DEFAULT_ACCOUNTS = [
    'roshytv',
    'javcodelust',
    'xlovelyhub',
    'pornhub',
    'onlyfans',
  ];

  const DEFAULTS_VERSION = 3;

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
  let scanProfiles = load(STORE_KEYS.scanProfiles, true);
  let cleanZeroWidth = load(STORE_KEYS.cleanZeroWidth, true);
  let fabPosition = load(STORE_KEYS.fabPosition, 'left');
  let fabVisible = load(STORE_KEYS.fabVisible, true);
  let hiddenCount = 0;

  // Zero-width space and invisible character cleaner (anti-evasion)
  const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]/g;

  // Leetspeak & character normalizer
  function normalizeText(str, removeInvisible = true) {
    if (!str) return '';
    let res = str.toLocaleLowerCase('tr');
    if (removeInvisible && cleanZeroWidth) {
      res = res.replace(ZERO_WIDTH_REGEX, '');
    }
    return res;
  }

  function getKeywordList() {
    return (Array.isArray(keywords) ? keywords : [])
      .map(k => normalizeText(k))
      .filter(Boolean);
  }

  function getAccountList() {
    return (Array.isArray(blockedAccounts) ? blockedAccounts : [])
      .map(a => normalizeText(a).replace(/^@/, '').trim())
      .filter(Boolean);
  }

  let cachedAccountSet = new Set(getAccountList());
  let cachedKeywordList = getKeywordList();

  function refreshCaches() {
    cachedAccountSet = new Set(getAccountList());
    cachedKeywordList = getKeywordList();
  }

  // Varsayilan listeleri surum guncellemesinde birlestir
  try {
    if (!Array.isArray(blockedAccounts)) blockedAccounts = [];
    if (!Array.isArray(keywords)) keywords = [];
    const appliedVersion = load(STORE_KEYS.accountsVersion, 0);
    if (appliedVersion < DEFAULTS_VERSION) {
      const haveAcc = new Set(getAccountList());
      let accChanged = false;
      for (const a of DEFAULT_ACCOUNTS) {
        const n = normalizeText(a).replace(/^@/, '').trim();
        if (n && !haveAcc.has(n)) {
          blockedAccounts.push(n);
          haveAcc.add(n);
          accChanged = true;
        }
      }
      if (accChanged) save(STORE_KEYS.accounts, blockedAccounts);

      const haveKw = new Set(getKeywordList());
      let kwChanged = false;
      for (const k of DEFAULT_KEYWORDS) {
        const n = normalizeText(k);
        if (n && !haveKw.has(n)) {
          keywords.push(k);
          haveKw.add(n);
          kwChanged = true;
        }
      }
      if (kwChanged) save(STORE_KEYS.keywords, keywords);

      save(STORE_KEYS.accountsVersion, DEFAULTS_VERSION);
      refreshCaches();
    }
  } catch (_) { /* yoksay */ }

  function getTweetText(article) {
    const parts = [];
    
    // 1. Ana tweet metni
    const textEls = article.querySelectorAll('div[data-testid="tweetText"]');
    textEls.forEach(el => {
      if (el.innerText) parts.push(el.innerText);
    });

    // 2. Linkler ve Link Onizleme Kartlari
    const cardEls = article.querySelectorAll('div[data-testid="card.layoutLarge.detail"], div[data-testid="card.wrapper"], a[target="_blank"]');
    cardEls.forEach(el => {
      const t = el.innerText || el.getAttribute('href') || el.getAttribute('title') || '';
      if (t) parts.push(t);
    });

    // 3. Medya alt / title etiketleri
    const mediaEls = article.querySelectorAll('img[alt], video[aria-label]');
    mediaEls.forEach(el => {
      const alt = el.getAttribute('alt') || el.getAttribute('aria-label') || '';
      if (alt && alt !== 'Image' && alt !== 'Görsel') parts.push(alt);
    });

    if (parts.length === 0 && article.innerText) {
      parts.push(article.innerText);
    }

    return parts.join(' ');
  }

  function getAuthorInfo(article) {
    let handle = '';
    let displayName = '';

    const userEl = article.querySelector('div[data-testid="User-Name"]');
    if (userEl) {
      displayName = userEl.innerText || '';
      const handleMatch = displayName.match(/@([A-Za-z0-9_]{1,15})/);
      if (handleMatch) {
        handle = handleMatch[1].toLowerCase();
      }
    }

    if (!handle) {
      const links = article.querySelectorAll('a[href^="/"]');
      const reserved = ['home', 'explore', 'notifications', 'messages', 'search', 'settings', 'i', 'compose', 'hashtag', 'jobs', 'premium'];
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        const m = href.match(/^\/([A-Za-z0-9_]{1,15})(\/|$)/);
        if (m && !reserved.includes(m[1].toLowerCase())) {
          handle = m[1].toLowerCase();
          break;
        }
      }
    }

    return { handle, displayName };
  }

  function matchReason(article) {
    const { handle, displayName } = getAuthorInfo(article);

    // 1. Engelli hesap kontrolu
    if (handle && cachedAccountSet.has(handle)) {
      return { type: 'account', value: '@' + handle, label: 'hesap: @' + handle };
    }

    // 2. Profil adi / gorunen isimde anahtar kelime kontrolu (bot avcisi)
    if (scanProfiles && displayName) {
      const normName = normalizeText(displayName);
      for (const kw of cachedKeywordList) {
        if (kw && normName.includes(kw)) {
          return { type: 'profile', value: kw, label: 'profil: ' + kw + (handle ? ' (@' + handle + ')' : '') };
        }
      }
    }

    // 3. Tweet icerigi, linkler ve kartlarda anahtar kelime kontrolu
    const text = normalizeText(getTweetText(article));
    for (const kw of cachedKeywordList) {
      if (kw && text.includes(kw)) {
        return { type: 'keyword', value: kw, label: 'kelime: ' + kw };
      }
    }

    return null;
  }

  const STYLE_ID = 'tpb-style';
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = `
      /* BLUR KATMANI: sadece article'in kendisi bulaniklasir.
         Rozet (.tpb-badge) ve veil (.tpb-veil) article'in KARDESI oldugu
         icin bu filter'dan etkilenmez. */
      .tpb-blurred {
        filter: blur(16px) !important;
        user-select: none !important;
        pointer-events: none !important;
        transition: filter 0.2s ease-in-out !important;
      }
      /* Hover / focus / active ile ASLA kendiliginden acilmasin.
         Sadece rozetteki butona tiklayinca acilir. */
      .tpb-blurred:hover,
      .tpb-blurred:focus,
      .tpb-blurred:focus-within,
      .tpb-blurred:active,
      .tpb-outer:hover > .tpb-blurred,
      .tpb-outer:hover > article.tpb-blurred {
        filter: blur(16px) !important;
        user-select: none !important;
        pointer-events: none !important;
      }
      .tpb-blurred video {
        pointer-events: none !important;
      }
      .tpb-outer {
        position: relative !important;
      }
      .tpb-wrap {
        position: relative !important;
        min-height: 56px !important;
      }
      /* Seffaf tuzak katmani: mouse/touch tweet icerigine hic ulasamaz,
         boylece X'in hover-card / video-autoplay / link-preview gibi
         davranislari tetiklenemez. Tiklamalari yutar, blur'u acmaz. */
      .tpb-veil {
        position: absolute;
        inset: 0;
        z-index: 9000;
        background: transparent;
        cursor: default;
      }
      .tpb-badge {
        position: absolute;
        top: 10px;
        right: 12px;
        z-index: 9999;
        background: rgba(15, 20, 25, 0.92);
        color: #eff3f4;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 9999px;
        cursor: default;
        border: 1px solid rgba(83, 100, 113, 0.6);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        pointer-events: auto !important;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: calc(100% - 24px);
        overflow: hidden;
        white-space: nowrap;
        backdrop-filter: blur(8px);
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .tpb-badge:hover {
        background: #1d9bf0;
        color: #ffffff;
        border-color: #1d9bf0;
        transform: scale(1.02);
      }
      .tpb-badge-lock {
        flex-shrink: 0;
      }
      /* Neden metni uzunsa "..." ile kisalir, tamami tooltip'te */
      .tpb-badge-reason {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 170px;
        opacity: 0.75;
        font-weight: 500;
        flex-shrink: 1;
        min-width: 0;
      }
      .tpb-badge-sep {
        opacity: 0.4;
        flex-shrink: 0;
      }
      .tpb-badge-btn {
        background: transparent;
        border: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
        padding: 0;
        margin: 0;
        outline: none;
      }
      .tpb-fab {
        position: fixed;
        bottom: 20px;
        z-index: 10000;
        background: #1d9bf0;
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        padding: 8px 14px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 6px 20px rgba(29, 155, 240, 0.4);
        display: flex;
        align-items: center;
        gap: 6px;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease;
        user-select: none;
      }
      .tpb-fab.left { left: 20px; }
      .tpb-fab.right { right: 20px; }
      .tpb-fab:hover {
        transform: scale(1.06);
        background: #1a8cd8;
      }
      .tpb-fab:active {
        transform: scale(0.96);
      }
      .tpb-panel-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(4px);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tpb-panel {
        background: #000000;
        color: #e7e9ea;
        border: 1px solid #2f3336;
        border-radius: 20px;
        width: 460px;
        max-width: 92vw;
        max-height: 88vh;
        overflow-y: auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 13px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.85);
        display: flex;
        flex-direction: column;
        gap: 14px;
        box-sizing: border-box;
      }
      .tpb-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #2f3336;
        padding-bottom: 12px;
      }
      .tpb-panel-title {
        font-size: 16px;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tpb-close-btn {
        background: transparent;
        border: none;
        color: #71767b;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 50%;
      }
      .tpb-close-btn:hover {
        color: #fff;
        background: #181818;
      }
      .tpb-tabs {
        display: flex;
        gap: 8px;
        border-bottom: 1px solid #2f3336;
        padding-bottom: 8px;
      }
      .tpb-tab-btn {
        background: transparent;
        border: none;
        color: #71767b;
        font-weight: 700;
        font-size: 13px;
        padding: 6px 12px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .tpb-tab-btn.active {
        background: #1d9bf0;
        color: #ffffff;
      }
      .tpb-tab-btn:hover:not(.active) {
        background: #181818;
        color: #e7e9ea;
      }
      .tpb-tab-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .tpb-panel label {
        font-weight: 700;
        color: #e7e9ea;
        display: block;
        margin-bottom: 4px;
      }
      .tpb-panel textarea {
        width: 100%;
        box-sizing: border-box;
        height: 76px;
        background: #16181c;
        color: #e7e9ea;
        border: 1px solid #2f3336;
        border-radius: 10px;
        padding: 8px 10px;
        font-size: 12px;
        font-family: inherit;
        resize: vertical;
        outline: none;
      }
      .tpb-panel textarea:focus {
        border-color: #1d9bf0;
      }
      .tpb-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #16181c;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #2f3336;
      }
      .tpb-checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        user-select: none;
      }
      .tpb-checkbox-desc {
        color: #71767b;
        font-size: 11px;
        margin-left: 22px;
      }
      .tpb-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 6px;
        padding-top: 10px;
        border-top: 1px solid #2f3336;
      }
      .tpb-btn-primary {
        background: #1d9bf0;
        color: #ffffff;
        border: none;
        border-radius: 9999px;
        padding: 8px 18px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .tpb-btn-primary:hover {
        background: #1a8cd8;
      }
      .tpb-btn-secondary {
        background: #2f3336;
        color: #e7e9ea;
        border: none;
        border-radius: 9999px;
        padding: 6px 12px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
      }
      .tpb-btn-secondary:hover {
        background: #3a3f44;
      }
      .tpb-stats-badge {
        color: #71767b;
        font-size: 12px;
      }
      .tpb-toast {
        position: fixed;
        bottom: 74px;
        left: 50%;
        transform: translateX(-50%);
        background: #1d9bf0;
        color: #fff;
        padding: 8px 16px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        z-index: 10005;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        pointer-events: none;
        animation: tpbFadeInOut 2.5s forwards;
      }
      @keyframes tpbFadeInOut {
        0% { opacity: 0; transform: translate(-50%, 10px); }
        15% { opacity: 1; transform: translate(-50%, 0); }
        85% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -10px); }
      }
    `;
    document.head.appendChild(st);
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'tpb-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function clearArticleMarks(article) {
    delete article.dataset.tpbDone;
    delete article.dataset.tpbReason;
    article.classList.remove('tpb-wrap', 'tpb-blurred');
    if (article.style.display === 'none') {
      article.style.display = '';
    }
    // Yeni yapi: rozet + veil sarmalayici .tpb-outer'in cocugu
    const outer = article.parentElement;
    if (outer && outer.classList && outer.classList.contains('tpb-outer')) {
      outer.querySelectorAll(':scope > .tpb-badge, :scope > .tpb-veil').forEach(n => n.remove());
      if (outer.style.display === 'none') outer.style.display = '';
      // unwrap: article'i eski yerine koy, bos wrapper'i kaldir
      outer.replaceWith(article);
    } else {
      // Eski surumden kalma: rozet article icinde kalmissa temizle
      const badge = article.querySelector('.tpb-badge');
      if (badge) badge.remove();
    }
  }

  function hideArticle(article, match) {
    if (article.dataset.tpbDone === '1') return;
    article.dataset.tpbDone = '1';
    article.dataset.tpbReason = match.label;
    hiddenCount += 1;
    updateFab();

    // Sarmalayici: rozet blur'lu article'in KARDESI olur, boylece
    // parent'taki blur filter rozeti bulaniklastirmaz.
    let outer = article.parentElement;
    if (!outer || !outer.classList || !outer.classList.contains('tpb-outer')) {
      outer = document.createElement('div');
      outer.className = 'tpb-outer tpb-wrap';
      article.parentNode.insertBefore(outer, article);
      outer.appendChild(article);
    }

    if (hideCompletely) {
      // Bos wrapper akista yer kaplamasin diye wrapper'i gizle
      outer.style.display = 'none';
      return;
    }

    article.classList.add('tpb-blurred');

    // Blur'lu videolarin ses/goruntu sizdirmamasi icin durdur + sessize al
    try {
      article.querySelectorAll('video').forEach(v => {
        try { v.pause(); } catch (_) { /* yoksay */ }
        v.muted = true;
        v.removeAttribute('autoplay');
      });
    } catch (_) { /* yoksay */ }

    // Seffaf tuzak katmani (yoksa ekle): hover/click icerige ulasamaz
    let veil = outer.querySelector(':scope > .tpb-veil');
    if (!veil) {
      veil = document.createElement('div');
      veil.className = 'tpb-veil';
      veil.setAttribute('aria-hidden', 'true');
      // Capture phase: alttaki tweet linklerine hic dusmesin
      veil.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
      }, true);
      veil.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
      }, true);
      outer.appendChild(veil);
    } else {
      veil.style.display = '';
    }

    let badge = outer.querySelector(':scope > .tpb-badge');
    if (badge) return; // zaten yerlesmis
    badge = document.createElement('div');
    badge.className = 'tpb-badge';
    // Tam neden tooltip'te, rozet uzerinde sadece ozet gorunur
    badge.title = 'Gizlenme nedeni: ' + match.label;

    const lockSpan = document.createElement('span');
    lockSpan.className = 'tpb-badge-lock';
    lockSpan.textContent = '🔒 gizlendi';
    badge.appendChild(lockSpan);

    const reasonSpan = document.createElement('span');
    reasonSpan.className = 'tpb-badge-reason';
    reasonSpan.textContent = match.label;
    badge.appendChild(reasonSpan);

    const sepSpan = document.createElement('span');
    sepSpan.className = 'tpb-badge-sep';
    sepSpan.textContent = '·';
    badge.appendChild(sepSpan);

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'tpb-badge-btn';
    toggleBtn.style.textDecoration = 'underline';
    toggleBtn.style.marginLeft = '4px';
    toggleBtn.textContent = 'göster';

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const isBlurred = article.classList.contains('tpb-blurred');
      const veilEl = outer.querySelector(':scope > .tpb-veil');
      if (isBlurred) {
        // SADECE bu butona tiklayinca acilir. Hover/mouseover asla acmaz.
        article.classList.remove('tpb-blurred');
        if (veilEl) veilEl.style.display = 'none';
        toggleBtn.textContent = 'tekrar gizle';
      } else {
        article.classList.add('tpb-blurred');
        if (veilEl) veilEl.style.display = '';
        toggleBtn.textContent = 'göster';
      }
    });

    badge.appendChild(toggleBtn);

    // Hizli listeye ekleme kisayolu (eger hesap tespit edildiyse ve listede henuz yoksa)
    const author = getAuthorInfo(article).handle;
    if (author && !cachedAccountSet.has(author)) {
      const addAccBtn = document.createElement('button');
      addAccBtn.type = 'button';
      addAccBtn.className = 'tpb-badge-btn';
      addAccBtn.style.opacity = '0.75';
      addAccBtn.style.marginLeft = '4px';
      addAccBtn.style.maxWidth = '110px';
      addAccBtn.style.overflow = 'hidden';
      addAccBtn.style.textOverflow = 'ellipsis';
      addAccBtn.style.whiteSpace = 'nowrap';
      addAccBtn.style.flexShrink = '0';
      addAccBtn.title = '@' + author + ' kullanıcısını engelli listesine kalıcı ekle';
      addAccBtn.textContent = '+' + author;
      addAccBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!blockedAccounts.includes(author)) {
          blockedAccounts.push(author);
          save(STORE_KEYS.accounts, blockedAccounts);
          refreshCaches();
          showToast('@' + author + ' engelli hesaplar listesine eklendi!');
          reScanAll();
        }
      });
      badge.appendChild(addAccBtn);
    }

    // Rozet wrapper'in cocugu olur -> blur filter'dan etkilenmez, hep net okunur.
    outer.appendChild(badge);
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const articles = scope.querySelectorAll
      ? scope.querySelectorAll('article[data-testid="tweet"]')
      : [];
    for (const a of articles) {
      if (a.dataset.tpbDone === '1') continue;
      const match = matchReason(a);
      if (match) hideArticle(a, match);
    }
  }

  function reScanAll() {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(clearArticleMarks);
    hiddenCount = 0;
    updateFab();
    scan(document);
  }

  let fab = null;
  function updateFab() {
    if (fab) {
      fab.style.display = fabVisible ? 'flex' : 'none';
      fab.textContent = '🔒 TPB (' + hiddenCount + ')';
    }
  }

  let activeTab = 'filters';

  function buildUI() {
    ensureStyle();

    // Floating Action Button (FAB)
    fab = document.createElement('button');
    fab.className = 'tpb-fab ' + (fabPosition === 'right' ? 'right' : 'left');
    fab.type = 'button';
    fab.textContent = '🔒 TPB (0)';
    fab.title = 'Twitter Prn Blocker — Yerel Filtre Ayarları (Alt+P)';
    fab.style.display = fabVisible ? 'flex' : 'none';
    fab.addEventListener('click', openPanel);
    document.body.appendChild(fab);

    // Klavye kisayolu: Alt + P
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        togglePanel();
      }
    });

    // Tampermonkey Menu Command
    try {
      if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('⚙️ TPB Ayarlarını Aç', openPanel);
        GM_registerMenuCommand('🔄 Filtreyi Yeniden Tara', reScanAll);
      }
    } catch (_) { /* yoksay */ }
  }

  let panelBackdrop = null;

  function openPanel() {
    if (panelBackdrop) return;

    panelBackdrop = document.createElement('div');
    panelBackdrop.className = 'tpb-panel-backdrop';
    panelBackdrop.addEventListener('click', (e) => {
      if (e.target === panelBackdrop) closePanel();
    });

    const panel = document.createElement('div');
    panel.className = 'tpb-panel';
    panelBackdrop.appendChild(panel);

    renderPanelContent(panel);
    document.body.appendChild(panelBackdrop);
  }

  function closePanel() {
    if (panelBackdrop) {
      panelBackdrop.remove();
      panelBackdrop = null;
    }
  }

  function togglePanel() {
    if (panelBackdrop) closePanel();
    else openPanel();
  }

  function renderPanelContent(panel) {
    panel.innerHTML = `
      <div class="tpb-panel-header">
        <div class="tpb-panel-title">
          <span>🔒 Twitter Prn Blocker</span>
          <span style="font-size:11px; font-weight:normal; color:#71767b; background:#16181c; padding:2px 8px; border-radius:9999px;">v0.3.2</span>
        </div>
        <button class="tpb-close-btn" id="tpb-close-modal" title="Kapat">✕</button>
      </div>

      <div class="tpb-tabs">
        <button class="tpb-tab-btn ${activeTab === 'filters' ? 'active' : ''}" data-tab="filters">🏷️ Filtreler</button>
        <button class="tpb-tab-btn ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">⚙️ Ayarlar</button>
        <button class="tpb-tab-btn ${activeTab === 'backup' ? 'active' : ''}" data-tab="backup">💾 Yedekleme</button>
      </div>

      <div id="tpb-tab-body" class="tpb-tab-content">
        <!-- Tab icerigi dinamik doldurulur -->
      </div>

      <div class="tpb-actions">
        <span class="tpb-stats-badge">Gizlenen tweet: <b id="tpb-stat-count" style="color:#1d9bf0;">${hiddenCount}</b></span>
        <div style="display:flex; gap:8px;">
          <button class="tpb-btn-secondary" id="tpb-rescan-btn" type="button">Yeniden Tara</button>
          <button class="tpb-btn-primary" id="tpb-save-btn" type="button">Kaydet ve Uygula</button>
        </div>
      </div>
    `;

    panel.querySelector('#tpb-close-modal').addEventListener('click', closePanel);

    panel.querySelectorAll('.tpb-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        panel.querySelectorAll('.tpb-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
        renderTabBody(panel.querySelector('#tpb-tab-body'));
      });
    });

    renderTabBody(panel.querySelector('#tpb-tab-body'));

    panel.querySelector('#tpb-rescan-btn').addEventListener('click', () => {
      reScanAll();
      showToast('Tweetler yeniden tarandı!');
      panel.querySelector('#tpb-stat-count').textContent = hiddenCount;
    });

    panel.querySelector('#tpb-save-btn').addEventListener('click', () => {
      saveCurrentPanelSettings(panel);
      refreshCaches();
      reScanAll();
      updateFab();
      showToast('Ayarlar kaydedildi ve uygulandı!');
      closePanel();
    });
  }

  function renderTabBody(container) {
    if (activeTab === 'filters') {
      container.innerHTML = `
        <div>
          <label>Kelimeler & Etiketler (virgülle veya yeni satırla ayır)</label>
          <textarea id="tpb-kw-input" placeholder="onlyfans, porn, ifsa, escort, ...">${(keywords || []).join(', ')}</textarea>
          <div style="font-size:11px; color:#71767b; margin-top:2px;">Toplam ${(keywords || []).length} kelime aktif</div>
        </div>
        <div>
          <label>Engelli Hesaplar (virgülle ayır, @ siz)</label>
          <textarea id="tpb-acc-input" placeholder="roshytv, javcodelust, ...">${(blockedAccounts || []).join(', ')}</textarea>
          <div style="font-size:11px; color:#71767b; margin-top:2px;">Toplam ${(blockedAccounts || []).length} hesap aktif</div>
        </div>
      `;
    } else if (activeTab === 'settings') {
      container.innerHTML = `
        <div class="tpb-checkbox-group">
          <label class="tpb-checkbox-label">
            <input type="checkbox" id="tpb-hide-check" ${hideCompletely ? 'checked' : ''}>
            <span>Tamamen Gizle (Display: None)</span>
          </label>
          <span class="tpb-checkbox-desc">Açıkken blur yerine tweet tamamen kaldırılır. Kapalıyken 'göster' butonu ile bulanıklaştırılır.</span>
        </div>

        <div class="tpb-checkbox-group">
          <label class="tpb-checkbox-label">
            <input type="checkbox" id="tpb-profiles-check" ${scanProfiles ? 'checked' : ''}>
            <span>Profil İsimlerini ve Biyografileri Tara (Bot Avcısı)</span>
          </label>
          <span class="tpb-checkbox-desc">Yorumlarda sadece '.' atan botların profil isimlerindeki +18 kelimeleri yakalar.</span>
        </div>

        <div class="tpb-checkbox-group">
          <label class="tpb-checkbox-label">
            <input type="checkbox" id="tpb-zerowidth-check" ${cleanZeroWidth ? 'checked' : ''}>
            <span>Görünmez Karakter Temizleyici (Anti-Evasion)</span>
          </label>
          <span class="tpb-checkbox-desc">Spam botların filtreleri atlatmak için kelime aralarına koyduğu görünmez unicode karakterleri temizler.</span>
        </div>

        <div class="tpb-checkbox-group">
          <label class="tpb-checkbox-label">
            <input type="checkbox" id="tpb-fab-check" ${fabVisible ? 'checked' : ''}>
            <span>Sol/Sağ Alt Butonu (FAB) Göster</span>
          </label>
          <span class="tpb-checkbox-desc">Kapatsan dahi Tampermonkey menüsünden veya <b>Alt+P</b> kısayolu ile paneli açabilirsin.</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:#16181c; padding:10px 12px; border-radius:12px; border:1px solid #2f3336;">
          <span style="font-weight:600;">Buton Konumu:</span>
          <select id="tpb-pos-select" style="background:#000; color:#fff; border:1px solid #2f3336; border-radius:6px; padding:4px 8px;">
            <option value="left" ${fabPosition === 'left' ? 'selected' : ''}>Sol Alt</option>
            <option value="right" ${fabPosition === 'right' ? 'selected' : ''}>Sağ Alt</option>
          </select>
        </div>
      `;
    } else if (activeTab === 'backup') {
      container.innerHTML = `
        <div style="color:#71767b; font-size:12px; line-height:1.4;">
          Filtre listeni yedekleyebilir veya başka bir tarayıcıya içe aktarabilirsin.
        </div>
        <div style="display:flex; gap:8px;">
          <button class="tpb-btn-secondary" id="tpb-export-btn" style="flex:1;">📤 JSON Olarak Kopyala</button>
          <button class="tpb-btn-secondary" id="tpb-import-btn" style="flex:1;">📥 İçe Aktar</button>
        </div>
        <button class="tpb-btn-secondary" id="tpb-reset-defaults-btn" style="color:#f4212e; border-color:#536471; margin-top:8px;">⚠️ Varsayılan Listeye Sıfırla</button>
      `;

      container.querySelector('#tpb-export-btn').addEventListener('click', () => {
        const data = JSON.stringify({ keywords, blockedAccounts, hideCompletely, scanProfiles, cleanZeroWidth }, null, 2);
        navigator.clipboard.writeText(data).then(() => {
          showToast('Yedek JSON panoya kopyalandı!');
        }).catch(() => {
          prompt('JSON verisini kopyala:', data);
        });
      });

      container.querySelector('#tpb-import-btn').addEventListener('click', () => {
        const raw = prompt('Daha önce kopyaladığın JSON yedeğini buraya yapıştır:');
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.keywords)) keywords = parsed.keywords;
          if (Array.isArray(parsed.blockedAccounts)) blockedAccounts = parsed.blockedAccounts;
          if (typeof parsed.hideCompletely === 'boolean') hideCompletely = parsed.hideCompletely;
          if (typeof parsed.scanProfiles === 'boolean') scanProfiles = parsed.scanProfiles;
          if (typeof parsed.cleanZeroWidth === 'boolean') cleanZeroWidth = parsed.cleanZeroWidth;

          save(STORE_KEYS.keywords, keywords);
          save(STORE_KEYS.accounts, blockedAccounts);
          save(STORE_KEYS.hideCompletely, hideCompletely);
          save(STORE_KEYS.scanProfiles, scanProfiles);
          save(STORE_KEYS.cleanZeroWidth, cleanZeroWidth);

          refreshCaches();
          reScanAll();
          showToast('Yedek başarıyla yüklendi!');
          closePanel();
        } catch (e) {
          alert('Geçersiz JSON formatı!');
        }
      });

      container.querySelector('#tpb-reset-defaults-btn').addEventListener('click', () => {
        if (confirm('Tüm kelimeler ve hesaplar varsayılan listeye sıfırlansın mı?')) {
          keywords = [...DEFAULT_KEYWORDS];
          blockedAccounts = [...DEFAULT_ACCOUNTS];
          hideCompletely = false;
          scanProfiles = true;
          cleanZeroWidth = true;

          save(STORE_KEYS.keywords, keywords);
          save(STORE_KEYS.accounts, blockedAccounts);
          save(STORE_KEYS.hideCompletely, hideCompletely);
          save(STORE_KEYS.scanProfiles, scanProfiles);
          save(STORE_KEYS.cleanZeroWidth, cleanZeroWidth);

          refreshCaches();
          reScanAll();
          showToast('Varsayılanlara sıfırlandı!');
          closePanel();
        }
      });
    }
  }

  function saveCurrentPanelSettings(panel) {
    const kwEl = panel.querySelector('#tpb-kw-input');
    const accEl = panel.querySelector('#tpb-acc-input');
    const hideEl = panel.querySelector('#tpb-hide-check');
    const profEl = panel.querySelector('#tpb-profiles-check');
    const zeroEl = panel.querySelector('#tpb-zerowidth-check');
    const fabEl = panel.querySelector('#tpb-fab-check');
    const posEl = panel.querySelector('#tpb-pos-select');

    if (kwEl) {
      keywords = kwEl.value.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
      save(STORE_KEYS.keywords, keywords);
    }
    if (accEl) {
      blockedAccounts = accEl.value.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
      save(STORE_KEYS.accounts, blockedAccounts);
    }
    if (hideEl) {
      hideCompletely = hideEl.checked;
      save(STORE_KEYS.hideCompletely, hideCompletely);
    }
    if (profEl) {
      scanProfiles = profEl.checked;
      save(STORE_KEYS.scanProfiles, scanProfiles);
    }
    if (zeroEl) {
      cleanZeroWidth = zeroEl.checked;
      save(STORE_KEYS.cleanZeroWidth, cleanZeroWidth);
    }
    if (fabEl) {
      fabVisible = fabEl.checked;
      save(STORE_KEYS.fabVisible, fabVisible);
    }
    if (posEl) {
      fabPosition = posEl.value;
      save(STORE_KEYS.fabPosition, fabPosition);
      if (fab) {
        fab.className = 'tpb-fab ' + (fabPosition === 'right' ? 'right' : 'left');
      }
    }
  }

  // Smooth batching MutationObserver for 60fps scrolling
  let isScanScheduled = false;
  const queuedNodes = new Set();

  function processQueuedNodes() {
    isScanScheduled = false;
    for (const n of queuedNodes) {
      if (!n.isConnected) continue;
      if (n.matches && n.matches('article[data-testid="tweet"]')) {
        const match = matchReason(n);
        if (match) hideArticle(n, match);
      } else if (n.querySelectorAll) {
        scan(n);
      }
    }
    queuedNodes.clear();
  }

  function scheduleScan(node) {
    queuedNodes.add(node);
    if (!isScanScheduled) {
      isScanScheduled = true;
      requestAnimationFrame(processQueuedNodes);
    }
  }

  function init() {
    buildUI();
    scan(document);
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1) {
            scheduleScan(n);
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
