# False-positive regression tests

Offline, dependency-free test page for `twitterprnblocker.user.js`.

The suite guards the bug fixed in `v0.4.1`: substring matching hid innocent
tweets such as `analiz`, `kanal` and `normalizasyon`. Cases marked `show` are
the important ones — they must **not** be filtered.

`v0.5.0` adds coverage for two more regressions: ASCII-uppercase keywords
(`HENTAI`, `#IFSA`, `EROTIK`) and the confidence score (a weak keyword such as
`vip kanal` must not hide a tweet on its own).

## Run

```bash
# from the repository root
python3 -m http.server 8080
# then open http://localhost:8080/tests/run.html
```

A local HTTP server is required: opening `run.html` from `file://` usually
blocks loading `../twitterprnblocker.user.js` into the test iframe.

The page prints `N / M passed` and lists every case. No network access, no
dependencies, no build step.

## How it works

Each case runs in its own isolated iframe:

1. a fake tweet card (`article[data-testid="tweet"]`) is written into the iframe;
2. `GM_getValue` / `GM_setValue` / `GM_registerMenuCommand` are stubbed with an
   in-memory store seeded from the case `config`;
3. the **real** userscript is loaded into the iframe;
4. after a few animation frames the test checks `article.dataset.tpbDone`
   (`'1'` means the card was filtered) and, for `hide` cases, that
   `dataset.tpbReason` has the expected type.

## Files

- `cases.js` — the case list (data only). Field reference is at the top.
- `run.html` — the harness and result UI.

## Adding a case

Append to `window.TPB_CASES` in `cases.js`:

```js
{
  name: 'show: "xyz" must not trigger anything',
  expect: 'show',                 // or 'hide'
  expectType: 'keyword',          // only for 'hide': keyword|account|domain|profile|retweet|obfuscated
  config: { hideRetweets: true }, // optional settings overrides
  tweet: { handle: 'user', name: 'User', text: 'tweet body', links: [], alt: '' }
}
```

Prefer adding a `show` case for every filter rule you touch: a false positive is
worse than a missed tweet.
