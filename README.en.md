# twitterprnblocker

A lightweight Tampermonkey userscript that hides +18 / spam content in your X feed — **only in your own browser**.

[🇹🇷 Türkçe için tıklayın](README.md)

## One-click install

1. Install [Tampermonkey](https://www.tampermonkey.net/).
   - On Chrome, enable **"Allow user scripts"** in the extension details.
2. Click one of these (Tampermonkey opens the install page automatically):

   👉 **[Install twitterprnblocker (GitHub)](https://github.com/akamusti/twitterprnblocker/raw/refs/heads/main/twitterprnblocker.user.js)**
   👉 **[Install twitterprnblocker (GreasyFork)](https://greasyfork.org/tr/scripts/598698-twitter-prn-blocker-x-uyumlu-yerel-filtre)**

3. Confirm with **Install** on the page that opens.
4. Open x.com and manage your word/account lists from the **🔒 TPB** button at the bottom left.

> Note: clicking a raw file link ending in `.user.js` automatically triggers Tampermonkey.

## How it works
- Scans tweet cards (`article[data-testid="tweet"]`) live with a `MutationObserver`.
- Blurs (or fully hides, if you enable it) tweets matching your keyword/hashtag or account list.
- Click the badge to temporarily reveal a single tweet.
- All settings stay in your browser only (`GM_setValue` / `localStorage`).

## X rules compliance (important)
Things it deliberately does **NOT** do:
- No auto block / mute / unfollow / report, no X API calls.
- No sending, collecting, or mirroring tweet data anywhere.
- No auto reply / DM / like / retweet.
- No tokens, sessions, or rate-limit circumvention.

Single function: hide content already shown to you on your screen (ad-blocker logic).
This is different from the scraping/reselling and automation violations in the Nitter / Bright Data cases.

## Files
- `twitterprnblocker.user.js` — the userscript
