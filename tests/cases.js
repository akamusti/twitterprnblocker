/*
 * False-positive regression cases for twitterprnblocker.
 * Plain data only; loaded by tests/run.html. No build step, no dependencies.
 *
 * Field reference
 *   name        : test title
 *   expect      : 'hide' (should be filtered) | 'show' (must NOT be filtered)
 *   expectType  : optional match type for 'hide' cases
 *                 'keyword' | 'account' | 'domain' | 'profile' | 'retweet' | 'obfuscated'
 *   config      : optional overrides for the userscript settings
 *                 keywords, accounts, accountsVersion, hideCompletely,
 *                 scanProfiles, cleanZeroWidth, blockDomains, deobfuscate,
 *                 whitelist, hideRetweets, aggressive
 *   tweet       : { handle, name, text, links: [], alt, socialContext }
 *
 * The v0.4.1 bug this suite guards against: substring matching hid innocent
 * tweets ("analiz", "kanal", "normalizasyon"). "show" cases are the priority.
 * v0.5.0 also guards: ASCII-uppercase keywords ("HENTAI", "IFSA") and the
 * confidence score (a weak keyword alone must not hide).
 */
window.TPB_CASES = [
  // ---------------------------------------------------------------- SHOW ----
  // Must NOT be hidden: substring of removed/ambiguous keywords.
  {
    name: 'show: "analiz" must not trigger removed keyword "anal"',
    expect: 'show',
    tweet: { handle: 'editoryazar', name: 'Editor Yazar', text: 'Yeni analiz yazisi yayinda' }
  },
  {
    name: 'show: "kanal" must not trigger "vip kanal"',
    expect: 'show',
    tweet: { handle: 'haberci', name: 'Haberci', text: 'Haber kanali yeni video yayinladi' }
  },
  {
    name: 'show: "normalizasyon" must not trigger any keyword',
    expect: 'show',
    tweet: { handle: 'devblog', name: 'Dev Blog', text: 'Veritabani normalizasyon islemi tamamlandi' }
  },
  {
    name: 'show: "analitik" must not trigger removed keyword "anal"',
    expect: 'show',
    tweet: { handle: 'datafan', name: 'Data Fan', text: 'Analitik raporu hazir' }
  },
  {
    name: 'show: "DM" must not trigger removed keyword "dm"',
    expect: 'show',
    tweet: { handle: 'arkadas', name: 'Arkadas', text: 'Bana DM at, konusalim' }
  },
  {
    name: 'show: "arsivi" alone must not trigger multi-word "arsiv link"',
    expect: 'show',
    tweet: { handle: 'kutuphane', name: 'Kutuphane', text: 'Kutuphane arsivi guncellendi' }
  },
  {
    name: 'show: "18 yasindaki" must not trigger keyword "18 yas"',
    expect: 'show',
    tweet: { handle: 'egitim', name: 'Egitim Haber', text: '18 yasindaki gencler sinava girdi' }
  },
  {
    name: 'show: normal tweet with an example.com link',
    expect: 'show',
    tweet: { handle: 'hava', name: 'Hava Durumu', text: 'Gunluk hava durumu tahmini', links: ['https://example.com/weather'] }
  },
  {
    name: 'show: "sikistirma" must not trigger removed keyword "sikis"',
    expect: 'show',
    tweet: { handle: 'muhabir', name: 'Muhabir', text: 'Sikistirma algoritmasi hizlandi' }
  },
  {
    name: 'show: "seksiyon" must not trigger keyword "seks"',
    expect: 'show',
    tweet: { handle: 'tasarim', name: 'Tasarim', text: 'Seksiyon basliklari yenilendi' }
  },
  {
    name: 'show: plain everyday tweet (sanity)',
    expect: 'show',
    tweet: { handle: 'ofis', name: 'Ofis', text: 'Toplanti notlari paylasildi' }
  },

  // ---------------------------------------------------------------- HIDE ----
  // Detection must keep working.
  {
    name: 'hide: keyword "porno"',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam1', name: 'Spam Bir', text: 'yeni porno video yayinda' }
  },
  {
    name: 'hide: hashtag "#onlyfans"',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam2', name: 'Spam Iki', text: '#onlyfans icerik' }
  },
  {
    name: 'hide: blocked domain link (fansly.com)',
    expect: 'hide', expectType: 'domain',
    tweet: { handle: 'spam3', name: 'Spam Uc', text: 'yeni icerik', links: ['https://fansly.com/abc'] }
  },
  {
    name: 'hide: blocked account (@pornhub)',
    expect: 'hide', expectType: 'account',
    tweet: { handle: 'pornhub', name: 'Pornhub' }
  },
  {
    name: 'hide: obfuscated "p.o.r.n"',
    expect: 'hide', expectType: 'obfuscated',
    tweet: { handle: 'spam4', name: 'Spam Dort', text: 'p.o.r.n izle' }
  },
  {
    name: 'hide: keyword inside display name (bot hunter)',
    expect: 'hide', expectType: 'profile',
    tweet: { handle: 'cleanguard', name: 'Hot Onlyfans Girl', text: 'gunaydin' }
  },
  {
    name: 'hide: keyword inside image alt text',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'regularuser', name: 'Regular User', alt: 'nsfw gorsel' }
  },
  {
    name: 'hide: zero-width evasion ("por\\u200Bn")',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam5', name: 'Spam Bes', text: 'por\u200Bn izle' }
  },
  {
    name: 'show: weak keyword "vip kanal" alone must NOT hide (v0.5.0 confidence)',
    expect: 'show',
    tweet: { handle: 'spam6', name: 'Spam Alti', text: 'vip kanal linki' }
  },

  // ------------------------------------------------- UPPERCASE I (v0.5.0) --
  {
    name: 'hide: uppercase "HENTAI" (tosmallcase tr bug)',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam7', name: 'Spam Yedi', text: 'yeni HENTAI icerik' }
  },
  {
    name: 'hide: uppercase "#IFSA"',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam8', name: 'Spam Sekiz', text: '#IFSA paylasim' }
  },
  {
    name: 'hide: uppercase "EROTIK"',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam9', name: 'Spam Dokuz', text: 'EROTIK icerik' }
  },
  {
    name: 'show: uppercase "ISTANBUL" must not create a false positive',
    expect: 'show',
    tweet: { handle: 'sehir', name: 'Sehir', text: 'ISTANBUL da hava cok guzel' }
  },

  // ---------------------------------------------- CONFIDENCE SCORE (v0.5) --
  {
    name: 'hide: two distinct weak keywords together',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam10', name: 'Spam On', text: 'vip kanal ve arsiv link' }
  },
  {
    name: 'hide: weak keyword plus strong keyword',
    expect: 'hide', expectType: 'keyword',
    tweet: { handle: 'spam11', name: 'Spam Onbir', text: 'vip kanal porno' }
  },
  {
    name: 'hide: weak keyword alone in aggressive mode (legacy behavior)',
    expect: 'hide', expectType: 'keyword',
    config: { aggressive: true },
    tweet: { handle: 'spam12', name: 'Spam Oniki', text: 'vip kanal linki' }
  },
  {
    name: 'hide: retweet of a blocked account (hideRetweets on)',
    expect: 'hide', expectType: 'retweet',
    config: { hideRetweets: true },
    tweet: { handle: 'regularuser', name: 'Regular User', text: 'guzel fotograf', socialContext: '@pornhub Retweetledi' }
  },

  // ----------------------------------------------------------- WHITELIST ----
  {
    name: 'show: whitelist beats account/keyword rules',
    expect: 'show',
    config: { accounts: ['safekanal'], whitelist: ['safekanal'], accountsVersion: 5 },
    tweet: { handle: 'safekanal', name: 'Safe Kanal', text: 'porno izle' }
  }
];
