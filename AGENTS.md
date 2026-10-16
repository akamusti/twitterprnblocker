# AGENTS.md — twitterprnblocker

Bu dosya bu depoda çalışan ajanlar (OpenCode/Claude vb.) için **proje talimatlarıdır**.
Sıra: **global `~/.config/opencode/AGENTS.md` > bu dosya**. Çelişki olursa **en sıkı kural kazanır**.
Bu dosyadaki hiçbir madde global güvenlik kurallarını gevşetmez.

---

## 0. Dil

- **Kullanıcıyla HER ZAMAN Türkçe konuş.** (Açıklama, özet, soru, rapor — hepsi Türkçe.)
- **Kod, commit mesajı, dosya/PR açıklaması → İngilizce.**
- Değişken/fonksiyon adları, yorumlar, dokümantasyon: İngilizce.

---

## 1. ZORUNLU KURALLAR (kullanıcının istekleri)

### 1.1 Her kod işi bittiğinde "sır taraması" yap

Her kod değişikliği/değişiklik grubu tamamlandığında, **commit atmadan önce** kodu şunlar için tara:

| Kategori | Örnek |
|---|---|
| Token / API anahtarı | `api_key`, `secret`, `client_secret`, `access_token`, `bearer ...`, `token` |
| Sağlayıcı anahtarı | `ghp_…`, `github_pat_…`, `sk-…`, `AKIA…`, `AIza…`, `xoxb-…`, JWT (`eyJ…`) |
| Özel anahtar / sertifika | `-----BEGIN … PRIVATE KEY-----`, `.pem`, `.p12` |
| Parola | `password`, `passwd`, `pwd`, hardcoded şifre |
| Kişisel bilgi (PII) | e-posta, telefon, adres, gerçek ad, IP, özel hesap kullanıcı adları |

Çalıştırılacak tarama (staged + çalışan kopya):

```bash
# staged değişiklikler
git diff --cached -U0 | grep -niE '(api[_-]?key|secret|token|password|passwd|bearer|authorization|private[_-]?key|access[_-]?key|ghp_|github_pat_|sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|xox[baprs]-|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{10,}\.)'

# tüm çalışma ağacı (gitleaks varsa)
gitleaks detect --no-banner --redact 2>/dev/null || true
```

**Kural:** Sır/PII bulursan **commit etme**. Önce temizle, sonra devam et.

### 1.2 Sır bulunduysa ne yapılır (`.env` deseni)

1. Değeri koddan çıkar, `process.env` / `GM_getValue` / kullanıcı ayarı gibi bir yerden oku.
2. Gerçek dosya: **`.env`** (veya `.env.local`) → oluştur ama **asla commit etme**.
3. Örnek dosya: **`.env.example`** (yalnızca yer tutucu, gerçek değer YOK) → commit edilir.
4. **`.gitignore`'a ekle:** `.env`, `.env.*`, `!.env.example`, `*.pem`, `*.key`.
5. Kullanıcıya **Türkçe** tek satırla bildir: hangi sır taşındı, hangi dosyaya.
6. Sır **zaten git geçmişine girdiyse**: push etme; kullanıcıya söyle + anahtarı **sıfırla (rotate)** ve geçmiş temizliği (`git filter-repo` / BFG) öner. Sır sızmış sayılır, silmek yetmez.

### 1.3 Commit ve push

Bir iş bittiğinde (tarama TEMİZ ise):

1. Değişiklikleri İngilizce commit mesajıyla commit et (bkz. §3.4 format).
2. `origin` üzerindeki `main` dalına **push et**:
   ```bash
   git push origin main
   ```
3. Push başarısızsa (auth yok / çakışma) **uydurma, dur ve kullanıcıya Türkçe bildir**; sessizce farklı bir yol denemeye kalkma.
4. Push sonrası kullanıcıya Türkçe kısa özet: ne değişti, commit hash, push sonucu.

> ⚠️ **Kritik:** `@updateURL`/`@downloadURL` bu deponun `main` dalını işaret ediyor (bkz. §2.3).
> `main`'e push = **tüm kullanıcılarda otomatik güncelleme**. Bu yüzden sürüm/sürüm notu olmadan push etme.

---

## 2. PROJE GERÇEKLERİ (bunları bilmeden değişiklik yapma)

### 2.1 Ne bu?
`x.com` / `twitter.com` akışındaki +18, spam ve bot içeriği **yalnızca kullanıcının tarayıcısında** gizleyen bir **Tampermonkey userscript**. Tek dosya: `twitterprnblocker.user.js` (~1400 satır). Build adımı, paket yöneticisi, bağımlılık **YOK**.

### 2.2 Değişmez sözleşme (X Kuralları + gizlilik)
Bu proje README'de söz veriyor ve bunları **bozacak kod eklenemez**:

- ❌ Otomatik `block` / `mute` / `unfollow` / `report` **tıklama yok**.
- ❌ `X API` çağrısı, token/oturum kullanımı, rate-limit atlatma **yok**.
- ❌ Tweet/kullanıcı verisini dışa gönderen **ağ isteği (fetch/XHR/WebSocket) yok**, telemetri yok, harici CDN/script yok.
- ❌ Otomatik `reply` / `DM` / `like` / `retweet` yok.
- ✅ Yapılan tek şey: DOM'a zaten gelmiş `article` kartını yerel CSS ile blur / `display:none` (AdBlock mantığı).
- ✅ Tüm ayarlar yalnızca tarayıcıda: `GM_setValue/GM_getValue` (yoksa `localStorage` fallback).

Bu maddelerden birine dokunan bir "iyileştirme" istenirse **önce kullanıcıya uyumsuzluğu söyle**.

### 2.3 Sürümleme ve dağıtım zinciri
- Sürüm **3 yerde** tutarlı olmalı: userscript `@version`, `README.md` (TR), `README.en.md` (EN).
- `@updateURL` + `@downloadURL` → `.../raw/refs/heads/main/twitterprnblocker.user.js`.
  → `main`'e push edilen her şey kullanıcılara otomatik dağıtılır.
- GreasyFork sayfası depodan senkronize ediliyor: `https://greasyfork.org/tr/scripts/598698-...`
- Anlamlı sürüm akışı: `MAJOR.MINOR.PATCH` — hata düzeltme `PATCH`, yeni tespit özelliği `MINOR`, uyumluluk sözleşmesi değişimi `MAJOR`.

### 2.4 Kritik geçmiş: yanlış pozitif dersi
`v0.4.1` tam da bu yüzden çıktı: alt-dize eşleşmesi (`anal` → `analiz`, `kanal` → `normalizasyon`) masum tweetleri gizliyordu.
→ **Kural:** anahtar kelime eşleşmesi **kelime sınırı** ile yapılır (`buildKeywordRegex`). Yeni kelime eklerken her zaman masum kelimeyi test et (`kanal`, `analiz`, `normal`, `dm`→ kaldırıldı).

### 2.5 Kod düzeni
- Dosya tek bir IIFE içinde, `'use strict'`, ~1400 satır. Yapı: `STORE_KEYS` → varsayılanlar → storage (`load/save`) → normalizasyon/deobfuscation → eşleştirme → DOM gizleme → UI paneli → `MutationObserver`.
- Türkçe karakterler kodda **ASCII'ye çevrilmiş** (ör. `sikiş` yerine yorumlarda sadeleştirme). Dosya **UTF-8** kalsın, BOM ekleme.
- Kod içi yorumlar silinmiş (v0.2.1 kararı) — yalnızca metadata bloğu ve uyum notu korunuyor. Yeni yorum eklerken bu stile uy ya da kullanıcıya sor.

---

## 3. BİLMEN İYİ OLUR (kullanıcının sormadığı ama işine yarayacak şeyler)

### 3.1 `.gitignore` yok → sır sızma riski en büyük buradan gelir
Bir `.gitignore` eklendi (§1.2 ile uyumlu). Yeni gizli dosya üretirsen (anahtar, dump, token cache) önce ignore et, sonra oluştur.

### 3.2 Sır taramayı otomatikleştir
Tek seferlik grep yerine kalıcı koruma:
- **Yerel:** `pre-commit` framework + `gitleaks`/`detect-secrets` hook → commit'i sır varken engeller.
- **GitHub:** Settings → Code security → **Secret scanning + Push protection** açık olsun (public repolarda ücretsiz).
- Geçmiş taraması: `gitleaks detect` (tüm commit geçmişi).

### 3.3 `main`'e doğrudan push riskli
`@updateURL` yüzünden tek hatalı commit tüm kullanıcıları etkiler. Daha güvenli akış:
- Riskli/çok dosyalı işlerde `feature/...` dalı + PR; sadece hazır olunca `main`.
- Zorunlu **tetikleyici kelime**: "doğrudan main'e push et" → yoksa küçük ve düşük riskli işlerde mevcut kural (§1.3) geçerli.

### 3.4 Commit mesajı formatı (İngilizce)
Mevcut geçmişle uyumlu stil:
```
vX.Y.Z: <short imperative summary>

- what changed and why
- compliance/detection impact if any
```
Küçük işlerde: `fix: ...`, `feat: ...`, `docs: ...`, `refactor: ...` (Conventional Commits) da kabul.

### 3.5 Test yok → manuel kontrol listesi
Userscript'te otomatik test altyapısı yok. Değişiklikten sonra en azından:
1. `x.com` akışını kaydır, konsolda hata var mı (F12)?
2. Yeni/değişen filtre: hem **yakalanması gerekeni** hem **yakalanmaması gerekeni** dene (yanlış pozitif = en kritik hata sınıfı).
3. `Alt + P` paneli açılıyor mu, ayarlar kaydediliyor mu, JSON yedek al/geri yükle çalışıyor mu?
4. `GM_*` yoksa `localStorage` fallback hâlâ çalışıyor mu?

### 3.6 Ağ isteği ekleme yasağını kod seviyesinde koru
`fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, `import(` gibi çağrılar bu dosyada **hiç olmamalı**. Bir "özetleme/AI" özelliği istense bile harici çağrı **eklenmez** (hem X uyumu hem kullanıcı gizlilik sözü). Gerekirse **tamamen yerel** bir çözüm öner.

### 3.7 Adlandırma tutarsızlığı
Depo/userscript adı `twitterprnblocker`, GreasyFork adı `twitter-prn-blocker`. Değiştirme; uyumluluk/otomatik güncelleme URL'lerini kırma riski var. Kullanıcı isterse konuşulur.

### 3.8 Sürüm notu ve README senkronu
Kullanıcı göreceği davranış değiştiyse `README.md` **ve** `README.en.md` birlikte güncellenir; özellik tablosundaki `(vX.Y.Z)` etiketleri eski sürümü işaret ediyorsa güncelle.

### 3.9 Geri dönüş (rollback) planı
Bozuk bir sürüm push edildiyse: yeni bir `PATCH` sürümle düzelt (geçmişi geri sarma), çünkü kullanıcılar `@updateURL` ile yalnızca **ileri** sürümü çeker. `git revert` + yeni sürüm numarası en hızlı çözümdür.

### 3.10 Yasal lisans
`LICENSE` GPL-3.0-only; userscript metadata'da `@license GPL-3.0-only`. Kod alıntılarında lisansı koru, başka lisanslı kodu karıştırma.

---

## 4. Kısa kontrol listesi (her iş sonunda)

- [ ] Sır / token / PII taraması temiz (§1.1)
- [ ] Bulunan sır varsa `.env` + `.env.example` + `.gitignore` + rotate (§1.2)
- [ ] Uyumluluk sözleşmesi bozulmadı (ağ isteği / otomatik işlem yok) (§2.2)
- [ ] Sürüm 3 yerde güncel: userscript `@version`, `README.md`, `README.en.md` (§2.3)
- [ ] Yanlış pozitif testi yapıldı (§3.5)
- [ ] İngilizce commit + `git push origin main` (§1.3)
- [ ] Kullanıcıya **Türkçe** özet verildi (§0)
