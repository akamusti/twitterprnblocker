# twitterprnblocker

X akışındaki +18 / spam içerikleri **sadece senin tarayıcında** gizleyen Tampermonkey userscript'i.

## Kurulum
1. [Tampermonkey](https://www.tampermonkey.net/) kur.
2. `twitterprnblocker.user.js` dosyasını açıp "Install" de (veya dosyayı Tampermonkey'e sürükle).
3. x.com'u aç, sağ alttaki **🔒 TPB** butonundan kelime/hesap listeni düzenle.

## Nasıl çalışır?
- `article[data-testid="tweet"]` kartlarını `MutationObserver` ile tarar.
- Kelime/hashtag veya hesap eşleşirse tweet'i blur'lar (veya ayardan tamamen gizler).
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
