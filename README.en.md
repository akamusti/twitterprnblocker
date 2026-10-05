# twitterprnblocker

[🇹🇷 Türkçe için tıklayın](README.md)

A lightweight, privacy-first Tampermonkey userscript that filters out +18, spam, and bot content in your X (Twitter) feed — **strictly on your own browser**.

---

## ⚡ Features

- 🛡️ **Advanced Detection Engine**:
  - Scans tweet text, hashtags, media alt descriptions, and link preview cards (`onlyfans.com`, `fansly.com`, etc.).
  - **Bot Hunter**: Detects adult keywords in user display names and bios for bot replies that post meaningless dots (`.`) or emojis.
  - **Anti-Evasion Cleaner**: Strips zero-width spaces and invisible Unicode characters that spam bots use to bypass keyword filters.
- 🚀 **Buttery 60 FPS Performance**: Uses a `requestAnimationFrame` mutation batching queue to prevent scroll stutters on heavy X timelines.
- 🎨 **Modern & Native UI**:
  - Sleek X-styled dark theme modal dashboard.
  - **Filter Modes**: Blur (with 1-click reveal) or Complete Hide (`display: none`).
  - **Quick Account Block**: 1-click `+ @handle` button directly on blurred tweet badges to permanently add spammers to your list.
  - **Backup & Restore**: Export/Import your filters to/from JSON or reset to curated defaults with one click.
  - **Keyboard Shortcut**: Press `Alt + P` to instantly toggle the control panel.
  - **Tampermonkey Menu Integration**: Access settings from the Tampermonkey popup menu and receive automatic updates.

---

## 📥 One-Click Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
   - On Chromium-based browsers: Enable **"Allow user scripts"** (Developer Mode / User Scripts) in extension details.
2. Click one of the links below (Tampermonkey will open the installation dialog automatically):

   👉 **[Install twitterprnblocker (GitHub)](https://github.com/akamusti/twitterprnblocker/raw/refs/heads/main/twitterprnblocker.user.js)**  
   👉 **[Install twitterprnblocker (GreasyFork)](https://greasyfork.org/tr/scripts/598698-twitter-prn-blocker-x-uyumlu-yerel-filtre)**

3. Click **Install** on the page that opens.
4. Open **x.com**; configure keywords & blocked accounts from the **🔒 TPB** button at the bottom or press `Alt + P`.

---

## 🔒 100% Client-Side & Privacy Compliant

This userscript operates **strictly client-side**:
- ❌ No automated block / mute / unfollow / report clicks; **zero X API calls**.
- ❌ Does **not** transmit, collect, or mirror any tweet or user data.
- ❌ No automated replies, likes, DMs, or retweets.
- ❌ No tokens, sessions, or rate-limit bypass tricks.
- ✅ **Ad-Blocker Logic**: Purely filters and blurs/hides DOM elements already delivered to your browser using local CSS.

---

## 📁 Files

- [`twitterprnblocker.user.js`](twitterprnblocker.user.js) — Userscript (v0.3.0)
