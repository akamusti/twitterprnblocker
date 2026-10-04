# twitterprnblocker

[🇬🇧 English version](README.en.md)

X akışındaki +18 / spam içerikleri **sadece senin tarayıcında** gizleyen Tampermonkey userscript'i.

## Kurulum (tek tık)

1. [Tampermonkey](https://www.tampermonkey.net/) kur.
   - Chrome kullanıyorsan uzantı detayında **"Kullanıcı komut dosyalarına izin ver"** anahtarını aç.
2. Şuna tıkla (Tampermonkey kurulum sayfasını otomatik açar):

   👉 **[twitterprnblocker'i Kur (GitHub)](https://github.com/akamusti/twitterprnblocker/raw/refs/heads/main/twitterprnblocker.user.js)**
   👉 **[twitterprnblocker'i Kur (GreasyFork)](https://greasyfork.org/tr/scripts/598698-twitter-prn-blocker-x-uyumlu-yerel-filtre)**

3. Açılan sayfada **Kur / Install** de.
4. x.com'u aç, sol alttaki **🔒 TPB** butonundan kelime/hesap listeni düzenle.

> Not: `.user.js` ile biten ham (raw) dosya linkine tıklamak Tampermonkey'i otomatik tetikler — o repodaki düzen de aynen bu.
> GreasyFork sayfası da yayında, iki linkten biri kullanılabilir.

## Nasıl çalışır?
- `article[data-testid="tweet"]` kartlarını `MutationObserver` ile tarar.
- Kelime/hashtag veya hesap eşleşirse tweet'i blur'lar (veya ayardan tamamen gizler).
- Gömülü hesap listesi: `@roshytv, @javcodelust, @xlovelyhub, @pornhub, @onlyfans` (kendi listene eklenir, panelden çıkarabilirsin).
- Ayarlar sadece senin tarayıcında (`GM_setValue` / `localStorage`) saklanır.

## X kurallarına uyum (önemli)
Bilerek **yapılmayanlar**:
- Otomatik block / mute / unfollow / report yok, X API çağrısı yok.
- Tweet verisini dışarı gönderme / toplama / aynalama yok.
- Otomatik reply / DM / like / retweet yok.
- Token, session, rate-limit atlatma yok.

Tek işlev: sana zaten gösterilmiş içeriği ekranında kapatmak (AdBlock mantığı).
Bu, Nitter / Bright Data davalarındaki scraping/satış ve otomasyon ihlallerinden farklıdır.

## Dosyalar
- `twitterprnblocker.user.js` — userscript v0.1
