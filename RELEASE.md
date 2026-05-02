# MyFitCraft — Yayın Rehberi

Bu döküman Play Store yayınına kadar olan tüm adımları içerir. Sıralı git, atlama.

---

## 1) Privacy Policy + Terms'i web'e yükle (5 dk)

```bash
npm run build:legal       # docs/ altında HTML üretir
git add docs scripts/build-legal-pages.js package.json
git commit -m "Add legal pages"
git push
```

Sonra GitHub repo arayüzünde:
- **Settings → Pages**
- Source: **Deploy from branch**
- Branch: **main** / Folder: **/docs** → Save
- ~1 dk sonra URL hazır:
  - `https://<kullanıcı>.github.io/<repo>/privacy.html`
  - `https://<kullanıcı>.github.io/<repo>/terms.html`

Bu URL'leri Play Console listing'de "Privacy policy" alanına yapıştıracaksın.

---

## 2) EAS hesabı + secrets (10 dk)

```bash
# Tek seferlik
npm install -g eas-cli
eas login
eas project:init    # bu projede ilk EAS build ise; eas.json zaten hazır
```

Firebase config'i EAS Cloud build sunucusuna eklemek için (her biri için):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIza..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "myfitcraft-1456.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "myfitcraft-1456"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "myfitcraft-1456.firebasestorage.app"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "337184612575"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:337184612575:web:accb375939fd699fbc896a"
```

(Değerleri kendi `.env` dosyandan kopyala. Listele: `eas secret:list`)

---

## 3) İlk Production Build (15-25 dk, EAS sunucusunda)

```bash
eas build --platform android --profile production
```

İlk çalıştırışında:
- Android keystore istenir → "Generate new keystore" seç (EAS yönetir, bir daha sormaz)
- Build başlar; tarayıcıda canlı log + bittiğinde `.aab` indirme linki

Çıktı: `application-XXXX.aab` (50-80 MB).

Hızlı fume-test için APK isteyebilirsin:
```bash
eas build --platform android --profile preview
```

---

## 4) Play Console'da yeni uygulama oluştur (10 dk)

1. [play.google.com/console](https://play.google.com/console) → **Create app**
2. App name: **MyFitCraft**
3. Default language: **Türkçe (Türkiye)**
4. App or game: **App**
5. Free or paid: **Free**
6. 4 declaration checkbox'ı işaretle → **Create app**

### Application package name (kritik)

Play Console artık ilk upload'da otomatik algılıyor: `com.myfitcraft.app` (app.config.ts'deki Android package).

⚠️ Bu paket adı **bir daha asla değiştirilemez**. Doğru olduğundan emin ol.

---

## 5) Store Listing — Hazır metinler

### App icon (zaten var)
`assets/icon.png` (1024×1024 PNG, alpha yok). Direkt yükle.

### Feature graphic (1024×500)
Henüz yok. Canva.com'da bedava şablonla 5 dakikada üretilir. Veya istersen sana üretirim.

### Phone screenshots (min 2, max 8)
Telefondan en az şu 4 ekranı çek:
- Dashboard (greeting + bugünkü program)
- Active Workout (rest timer aktif olsun)
- Reports (haftalık özet + grafikler)
- Programs (program listesi)

Önerim: Status bar'ı temizle (Android Developer Settings → "Demo Mode") — saat 09:41, %100 batarya, full sinyal görünür.

### Short description (max 80 karakter)
```
Antrenmanlarını planla, takip et ve ilerlemeni gör. Reklamsız fitness koçun.
```

### Full description (max 4000 karakter)
```
MyFitCraft, antrenman planlamayı ve takibini sadeleştiren bir fitness uygulamasıdır. Reklamsız, gereksiz özellikler olmadan, sadece ihtiyacın olanı sunar.

🏋️ NELER YAPABİLİRSİN?

• 600+ egzersiz kütüphanesi (kas grubuna göre filtreleme, animasyonlu açıklamalar)
• 20+ hazır profesyonel program (StrongLifts 5×5, Starting Strength, PPL, GZCLP, 5/3/1 BBB ve dahası)
• Kendi programını oluştur — günleri planla, egzersiz seç, set/tekrar/dinlenme süresini ayarla
• Programını haftalık takvime bağla — anasayfa o günün antrenmanını gösterir
• Aktif antrenman ekranı: set tik'leme, otomatik dinlenme zamanlayıcısı, progressive overload önerileri
• Vücut ölçümleri (kilo, bel, göğüs, kol) ve trend grafikleri
• Haftalık raporlar: toplam set, hacim, yeni rekorlar, kas grubu dağılımı
• BMI ve bel/boy oranı analizi
• Hedef kilo + tahmini ulaşma süresi (ETA)
• Kişiye özel öneri kartları (kural-tabanlı, internet bağımsız çalışır)
• Tam Türkçe + İngilizce dil desteği
• Açık + koyu tema
• Tüm verilerin senin Firebase hesabında, sadece sana ait

🚫 NE YAPMIYORUZ?

• Reklam yok
• Premium üyelik yok, hiçbir özellik kilitli değil
• İzleme/satış için veri toplama yok
• Sosyal medya entegrasyonu yok — sadece sen ve antrenmanın

⚠️ SAĞLIK UYARISI

MyFitCraft tıbbi tavsiye değildir. Yeni bir antrenman programına başlamadan önce, özellikle bilinen bir sağlık koşulun varsa, hekimine danış.

🛡️ GİZLİLİK

Tüm verilerin (antrenman, ölçüm, profil) yalnızca sana aittir ve sadece kendi Firebase hesabından erişilir. Üçüncü taraflara veri satmıyor veya pazarlama amacıyla paylaşmıyoruz. Detaylar için: [privacy URL]

📧 İletişim: myfitcraft.app@gmail.com
```

### Category
**Health & Fitness**

### Tags (3 tane seç)
- Workouts
- Fitness
- Strength training

### Contact details
- Email: `myfitcraft.app@gmail.com`
- Website: `https://<kullanıcı>.github.io/<repo>/` (legal pages URL'inin root'u)
- Privacy policy: `https://<kullanıcı>.github.io/<repo>/privacy.html`

---

## 6) Data Safety Form — Cevaplar

Play Console "App content → Data safety" altında. Aşağıdaki cevapları gir:

### Does your app collect or share any of the required user data types?
**Yes**

### Topladığın veri tipleri (her biri için "Collected" işaretle, "Shared with third parties" hayır):

| Veri | Toplanıyor mu | Amaç | Optional? |
|---|---|---|---|
| **Email address** | Evet | App functionality (Account management) | Required |
| **Name** | Evet | App functionality (Personalization) | Optional |
| **User-generated content** (workout logs, body measurements) | Evet | App functionality | Required |
| **App activity** (sayfa görüntüleme yok, sadece kendi içi durumlar) | Hayır | — | — |
| **Health & fitness info** (boy, kilo, vücut ölçümleri) | Evet | App functionality | Optional |

### Veriler şifreleniyor mu?
**Yes** (HTTPS üzerinden Firebase'e gidiyor)

### Kullanıcı veri silme talep edebilir mi?
**Yes** — `myfitcraft.app@gmail.com`'a yazarak

### Did you encrypt data in transit?
**Yes**

---

## 7) Content Rating Questionnaire

Play Console "App content → Content rating" altında IARC questionnaire:

- **Category:** Health, Fitness & Lifestyle
- Şiddet, cinsellik, küfür, uyuşturucu, kumar, kullanıcı içeriği paylaşımı: **Hepsine "No"**

Sonuç: **PEGI 3 / IARC 3+** (genel kullanıcı). 5 dakika sürer.

---

## 8) Target audience and content

- **Target age groups:** 18+
- Çocuklara yönelik mi? **No**

---

## 9) Ads declaration

Şu an: **App contains ads → No**

İleride AdMob eklersen Play Console'da bunu güncelle + UMP consent banner ekle.

---

## 10) AAB upload

1. **Production** veya **Internal testing** track seç (önce internal şart değil, direkt production'a da gidebilirsin çünkü 12-testçi/14-gün kuralı senin developer hesabın için zaten dolmuş).
2. **Create new release**
3. `application-XXXX.aab` dosyasını sürükle bırak
4. Release name: `1.0.0 (1)` (otomatik dolar)
5. Release notes (TR):
   ```
   • İlk sürüm
   • 600+ egzersiz, 20+ hazır program
   • Antrenman takibi, vücut ölçümleri, haftalık raporlar
   ```

6. **Save → Review release → Start rollout to production**
7. Google review: 1-7 gün arası (yeni app olduğu için ilk sefer biraz uzun olabilir)

---

## 11) Yayın sonrası — sürüm güncelleme

Yeni sürüm çıkarmak istediğinde:

1. `app.config.ts` → `version: "1.0.1"` (semver)
2. EAS auto-increment versionCode'u kendi halleder
3. ```bash
   eas build --platform android --profile production
   ```
4. Play Console → Production → Create new release → AAB upload → release notes → rollout

---

## ⚠️ Asla unutma

- **Keystore'u kaybetme.** EAS managed credentials kullandığın için EAS sunucusunda saklı; `eas credentials` ile yedek alabilirsin.
- **Package name (`com.myfitcraft.app`) değiştirilemez.**
- **Privacy policy URL'in çalışır olmalı** (Play review buraya bakar).
- Production build `--profile production` ile alınır, asla `--profile preview` ile değil.
