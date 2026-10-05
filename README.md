# twitterprnblocker

[🇬🇧 English version](README.en.md)

X (Twitter) akışındaki +18, spam ve bot içeriklerini **sadece senin tarayıcında** filtreleyen hafif ve gizlilik odaklı Tampermonkey userscript'i.

---

## ⚡ Özellikler

- 🛡️ **Gelişmiş Tespit Mekanizması**:
  - Tweet metni, etiketler ve bağlantı önizleme kartları (`onlyfans.com`, `fansly.com` vb.) taranır.
  - **Bot Avcısı**: Yorumlara sadece nokta (`.`) veya emoji atan spam botların profil isimleri ve biyografilerindeki +18 kelimeler tespit edilir.
  - **Görünmez Karakter Temizleyici (Anti-Evasion)**: Spam botların filtreleri atlatmak için kelimeler arasına gizlediği zero-width space ve unicode hilelerini çözer.
- 🚀 **60 FPS Akıcı Performans**: `requestAnimationFrame` kuyruğu ile sayfa kaydırırken takılma veya kasma yapmaz.
- 🎨 **Modern & Şık Panel Arayüzü**:
  - X tarzı modern koyu tema modal panel.
  - **Gizleme Modları**: Bulanıklaştırma (Blur) veya Tamamen Gizleme (`display: none`).
  - **Hızlı Hesap Engelleme**: Gizlenen tweet rozetindeki `+ @kullanici` butonuyla tek tıkla hesabı engelli listesine ekleme.
  - **Yedekleme & Sıfırlama**: Filtre listelerini JSON olarak dışa/içe aktarma veya tek tıkla varsayılanlara dönme.
  - **Klavye Kısayolu**: `Alt + P` ile paneli anında açıp kapatma.
  - **Tampermonkey Menü Entegrasyonu**: Uzantı menüsünden ayarlara erişim ve otomatik güncelleme desteği.

---

## 📥 Kurulum (Tek Tık)

1. Tarayıcına [Tampermonkey](https://www.tampermonkey.net/) uzantısını kur.
   - Chrome tabanlı tarayıcılarda: Uzantı detaylarında **"Kullanıcı komut dosyalarına izin ver"** (Developer Mode / User Scripts) seçeneğini aç.
2. Aşağıdaki linklerden birine tıkla (Tampermonkey kurulum penceresini otomatik açar):

   👉 **[twitterprnblocker'ı Kur (GitHub)](https://github.com/akamusti/twitterprnblocker/raw/refs/heads/main/twitterprnblocker.user.js)**  
   👉 **[twitterprnblocker'ı Kur (GreasyFork)](https://greasyfork.org/tr/scripts/598698-twitter-prn-blocker-x-uyumlu-yerel-filtre)**

3. Açılan sayfada **Kur / Install** butonuna bas.
4. **x.com**'u aç; sol alttaki **🔒 TPB** butonundan veya `Alt + P` kısayolu ile ayarları yönet.

---

## 🔒 X (Twitter) Kurallarına ve Gizliliğe Tam Uyum

Bu eklenti **%100 istemci taraflı (client-side)** bir filtreleme aracıdır:
- ❌ Otomatik block / mute / unfollow / report tıklamaz, **X API çağrısı yapmaz**.
- ❌ Tweet veya kullanıcı verilerini hiçbir harici sunucuya göndermez, toplamaz, aynalamaz.
- ❌ Otomatik reply / DM / like / retweet atmaz.
- ❌ Token, oturum veya rate-limit atlatma teknikleri kullanmaz.
- ✅ **AdBlock Mantığı**: Zaten tarayıcına gelmiş DOM öğelerini sadece senin ekranında yerel CSS ile gizler.

---

## 📁 Dosyalar

- [`twitterprnblocker.user.js`](twitterprnblocker.user.js) — Userscript (v0.3.0)
