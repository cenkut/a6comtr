# A6.com.tr — QR Dijital Şirket Kartviziti SaaS

Sen bu projede Senior Software Architect + Senior Full-Stack Developer + DevOps Engineer olarak çalışacaksın.

Hedefimiz demo hazırlamak değil.

**Gerçek production ortamında kullanılabilecek, çok şirketli, güvenli ve satılabilir bir SaaS oluşturmak.**

Domain:

`a6.com.tr`

Ürün:

**A6 QR Dijital Kartvizit**

Ana fikir:

Bir şirket A6.com.tr üzerinden kendi dijital şirket profilini oluşturur.

Sistem şirkete kalıcı bir QR kod verir.

Şirket bu QR kodu:

* kartvizit
* mağaza
* ürün kutusu
* katalog
* fatura
* tabela
* araç
* fuar standı
* broşür

üzerinde kullanabilir.

Müşteri QR kodu okuttuğunda şirketin mobil uyumlu A6 profil sayfasına ulaşır.

---

# 0. EN ÖNEMLİ MİMARİ KARAR

Şirket bilgilerini QR kodun içerisine doğrudan yazma.

QR yalnızca kalıcı A6 URL'sini taşımalıdır.

Örnek:

```text
https://a6.com.tr/q/X7KD92
```

Bu URL ilgili şirket profilini bulup public profile yönlendirmelidir.

Örnek:

```text
/q/X7KD92
    ↓
scan event
    ↓
/c/proaltes
```

QR oluşturulduktan sonra şirket:

* telefon
* adres
* logo
* VKN
* sosyal medya
* depo
* personel

bilgilerini değiştirse bile QR değişmemelidir.

QR'nin kalıcı olması kritik ürün gereksinimidir.

---

# 1. TEKNOLOJİ

Production-ready stack kullan.

Tercih:

```text
Next.js
TypeScript
PostgreSQL
Prisma ORM
React
responsive/mobile-first UI
Docker
```

Authentication passwordless e-mail OTP olacaktır.

Environment/config yapısı production-ready hazırlanmalıdır.

Secret değerleri source code içerisine koyma.

---

# 2. AUTHENTICATION

A6'da klasik password kullanılmayacak.

Kullanıcı:

```text
company@example.com
```

adresini girer.

Sistem 6 haneli tek kullanımlık doğrulama kodu yollar.

Örnek:

```text
381924
```

Kod:

* cryptographically secure oluşturulmalı
* DB'de plaintext saklanmamalı
* hash saklanmalı
* maksimum 10 dakika geçerli olmalı
* tek kullanımlık olmalı
* başarısız deneme sayısı sınırlandırılmalı
* yeniden kod gönderme rate-limit uygulanmalı
* başarılı doğrulama sonrası tüketilmeli
* eski kodlar invalidate edilmeli

Başarılı OTP verification sonrası secure session oluştur.

Session/cookie:

* HttpOnly
* Secure production
* SameSite uygun değer
* expiration
* logout/revoke

desteklemeli.

OTP kalıcı parola değildir.

Her yeni login gerektiğinde yeni OTP oluşturulur.

---

# 3. MULTI-TENANT MODEL

Sistem baştan multi-company SaaS olmalıdır.

Temel ilişki:

```text
User
Organization
Membership
Company
```

Bir kullanıcı ileride birden fazla organization/company yönetebilmelidir.

Bir organization birden fazla Company barındırabilmelidir.

Membership için minimum roller:

```text
OWNER
ADMIN
EDITOR
VIEWER
```

Her API/action server-side authorization kontrolü yapmalıdır.

Sadece UI'da buton gizlemek authorization sayılmaz.

---

# 4. COMPANY ENTITY

Company minimum:

```text
id
organizationId
name
legalName
slug
shortDescription
about
sector
foundedYear
logoUrl
coverUrl
website
primaryEmail
primaryPhone
whatsappPhone
taxOffice
taxNumber
mersisNumber
tradeRegistryNumber
status
publishedAt
createdAt
updatedAt
```

Status:

```text
DRAFT
ACTIVE
SUSPENDED
ARCHIVED
```

Slug unique olmalıdır.

Örnek public URL:

```text
https://a6.com.tr/c/proaltes
```

---

# 5. COMPANY LOCATIONS

Bir şirkette birden fazla adres bulunabilir.

Örnekler:

```text
HEADQUARTERS
BRANCH
STORE
WAREHOUSE
FACTORY
SERVICE
OTHER
```

Location:

```text
id
companyId
type
name
addressLine
district
city
postalCode
country
latitude
longitude
phone
email
contactPersonName
contactPersonPhone
workingHours
description
sortOrder
isVisible
```

Örnek:

```text
Bursa Deposu

Depo Sorumlusu:
Ahmet Yılmaz

Telefon:
...

Adres:
...

Çalışma:
08:30 - 18:00
```

---

# 6. SOCIAL LINKS

Hardcode edilmiş tek kolon seti yerine extensible model kullan.

```text
SocialLink

id
companyId
platform
label
url
sortOrder
isVisible
```

Platform örnekleri:

```text
INSTAGRAM
LINKEDIN
FACEBOOK
X
YOUTUBE
TIKTOK
OTHER
```

---

# 7. CUSTOM FIELDS

A6'nın önemli özelliklerinden biri standart kartvizit alanları dışında şirketin istediği kurumsal bilgileri yayınlayabilmesidir.

CustomField desteği oluştur.

Örneğin:

```text
Yetkili Bayi Kodu
12345
```

veya:

```text
Teknik Destek
0850 ...
```

Model:

```text
CustomField
id
companyId
section
label
value
type
sortOrder
isVisible
```

Type minimum:

```text
TEXT
PHONE
EMAIL
URL
NUMBER
DATE
```

---

# 8. FIELD VISIBILITY / PRIVACY

VKN, MERSİS veya personel telefonu gibi bilgiler kişisel/kurumsal hassas veri olabilir.

Her ilgili alan için görünürlük yönetimi sağla.

Minimum V1:

```text
isVisible
```

Public endpoint yalnızca visible alanları döndürmelidir.

Admin API'nin döndürdüğü private değerlerin yanlışlıkla public API üzerinden sızmamasına özellikle dikkat et.

Public DTO ile Admin DTO ayrı olmalıdır.

---

# 9. COMPANY PAGE BUILDER

Kullanıcı sabit bir kartvizit formu dolduruyormuş gibi değil, şirketinin mini web sayfasını hazırlıyormuş gibi hissetmelidir.

Public profile bölümleri:

```text
Hero
About
Quick Actions
Contact
Locations
Company Information
Social Media
Documents
Custom Fields
```

Her section için:

```text
enabled
sortOrder
```

tut.

Kullanıcı section'ları:

* açabilmeli
* kapatabilmeli
* sırasını değiştirebilmeli

MVP'de drag/drop zorunlu değil.

Up/down ordering yeterlidir.

---

# 10. THEME

CompanyProfileTheme oluştur.

Minimum:

```text
primaryColor
backgroundColor
textColor
buttonStyle
logoShape
showCover
```

Başlangıçta birkaç predefined theme hazırlanabilir.

Ancak public profile mobile-first olmalıdır.

Aşırı tasarım sistemi oluşturma.

Hız, okunabilirlik ve kurumsal görünüm önceliklidir.

---

# 11. QUICK ACTIONS

Public company page üzerinde üst bölümde minimum:

```text
Ara
WhatsApp
E-posta
Web Sitesi
Yol Tarifi
Rehbere Kaydet
```

aksiyonları desteklenmeli.

Sadece ilgili bilgi mevcut ve görünürse buton göster.

Örneğin WhatsApp numarası yoksa boş buton gösterme.

---

# 12. VCARD

Şirket için `.vcf` oluştur.

Public kullanıcı:

```text
Rehbere Kaydet
```

butonuna bastığında telefonuna şirketi contact olarak ekleyebilmelidir.

vCard içerisine yalnızca public alanları koy.

---

# 13. QR MODEL

QRCode entity oluştur.

Öneri:

```text
id
companyId
publicCode
status
createdAt
lastScannedAt
scanCount
```

publicCode tahmin edilmesi kolay incremental integer olmamalıdır.

Örnek:

```text
X7KD92
```

Route:

```text
GET /q/[publicCode]
```

İş akışı:

```text
QR request
→ QR doğrula
→ company active mi kontrol et
→ scan event oluştur
→ canonical company profile belirle
→ redirect
```

Public QR URL hiçbir zaman Company database id içermemelidir.

---

# 14. QR EXPORT

Dashboard'da şirket:

```text
QR PNG indir
QR SVG indir
```

yapabilmelidir.

QR:

* high error correction
* print-friendly
* SVG
* PNG

desteklemeli.

QR'nin merkezine logo koyulacaksa okunabilirlik test edilmeden default aktif yapma.

QR export sonucunu gerçek telefon kamerasıyla smoke test et.

---

# 15. ANALYTICS

Events oluştur.

Minimum event types:

```text
QR_SCAN
PROFILE_VIEW
PHONE_CLICK
WHATSAPP_CLICK
EMAIL_CLICK
WEBSITE_CLICK
DIRECTIONS_CLICK
VCARD_DOWNLOAD
DOCUMENT_CLICK
SOCIAL_CLICK
```

Event:

```text
id
companyId
qrCodeId
type
timestamp
referrer
userAgent
deviceType
country
```

Privacy-first yaklaşım kullan.

Gereksiz fingerprint sistemi kurma.

Raw IP saklamak zorunlu değil.

Analytics dashboard:

```text
Today
Last 7 Days
Last 30 Days
Total
```

göstermeli.

Minimum:

* QR Scan
* Profile View
* Phone Click
* WhatsApp Click
* Website Click
* Directions Click
* vCard Download

---

# 16. DOCUMENTS

Şirket profile:

* katalog
* fiyat listesi
* broşür
* sertifika
* PDF

ekleyebilmeli.

CompanyDocument:

```text
id
companyId
title
description
fileUrl
type
sortOrder
isVisible
createdAt
```

Dosya yüklemelerinde:

* MIME validation
* size limit
* randomized filename
* unsafe extension blocking

uygula.

---

# 17. CUSTOMER DASHBOARD

Dashboard navigation:

```text
Dashboard
Şirketim
Adresler
Sosyal Medya
Dokümanlar
Özel Alanlar
Kart Tasarımı
QR Kod
Analitik
Kullanıcılar
Hesap
```

Dashboard ana ekran:

```text
Company status
QR preview
Public profile link
Today's scans
7 day scans
30 day scans
Action clicks
```

şeklinde olabilir.

---

# 18. A6 PLATFORM ADMIN

A6 platform owner için şirket müşterilerinden ayrı bir ADMIN ekranı oluştur.

Admin aşağıdakileri görebilmeli:

```text
Organizations
Users
Companies
QR Codes
Subscriptions
Usage
Audit Logs
```

Company için:

```text
ACTIVE
SUSPENDED
ARCHIVED
```

işlemleri admin tarafından yönetilebilmeli.

SUSPENDED company'nin QR'sı uygun bir inactive page göstermeli.

---

# 19. AUDIT LOG

Önemli işlemleri AuditLog'a yaz.

Örnek:

```text
LOGIN_SUCCESS
LOGIN_FAILED
COMPANY_CREATED
COMPANY_UPDATED
COMPANY_PUBLISHED
COMPANY_SUSPENDED
QR_CREATED
USER_INVITED
USER_REMOVED
DOCUMENT_UPLOADED
DOCUMENT_DELETED
```

Kaydet:

```text
actorUserId
organizationId
companyId
action
metadata
createdAt
```

---

# 20. SUBSCRIPTION READY

V1'de gerçek ödeme entegrasyonu şart değil.

Ancak schema subscription-ready olmalıdır.

Önerilen package codes:

```text
TRIAL
BASIC
BUSINESS
AGENCY
```

Subscription minimum:

```text
organizationId
packageCode
status
startsAt
expiresAt
maxCompanies
maxUsers
```

Feature gate yapısı merkezi olmalı.

Kodun farklı yerlerinde:

```text
if package == ...
```

şeklinde dağınık logic oluşturma.

Örneğin:

```text
getEntitlements(subscription)
```

üzerinden yönet.

---

# 21. PUBLIC ROUTES

Minimum:

```text
/
 /login
 /verify
 /dashboard
 /dashboard/company
 /dashboard/locations
 /dashboard/social
 /dashboard/documents
 /dashboard/design
 /dashboard/qr
 /dashboard/analytics
 /dashboard/team

/c/[slug]
/q/[publicCode]
```

---

# 22. SEO

Public company profiles için:

```text
title
description
canonical
OpenGraph
robots
```

oluştur.

DRAFT profil indexlenmemeli.

ACTIVE/PUBLISHED profil için şirket ayarına göre index açılabilmeli.

---

# 23. SECURITY

Özellikle kontrol et:

* cross-tenant data leakage
* IDOR
* broken authorization
* OTP brute force
* OTP resend abuse
* enumeration
* XSS
* unsafe URL
* unsafe file upload
* SQL injection
* CSRF
* session fixation
* secrets exposure
* public/private DTO leakage

Bir organization başka organization verisine hiçbir endpoint üzerinden erişememeli.

Bunu integration test ile doğrula.

---

# 24. DATABASE

Database schema production-ready oluştur.

Foreign keys oluştur.

Index gerektiren alanları belirle.

Özellikle:

```text
User.email
Company.slug
QRCode.publicCode
Membership(userId, organizationId)
AnalyticsEvent(companyId, timestamp)
```

indexlerini değerlendir.

Migration oluştur.

Development seed sadece development ortamında çalışmalıdır.

Production'a otomatik demo seed uygulama.

---

# 25. UX

UI dili ilk etapta Türkçe.

Login:

```text
A6

Şirketinizin dijital kartvizitini oluşturun.

Şirket e-posta adresiniz

[ Devam Et ]
```

Verify:

```text
E-posta adresinize gönderdiğimiz
6 haneli kodu girin.

_ _ _ _ _ _

[ Giriş Yap ]
```

İlk giriş onboarding:

```text
Şirketinizi Oluşturun

Şirket / Marka Adı
Ticari Ünvan
Sektör
Telefon
Web Sitesi

[ Şirketimi Oluştur ]
```

Ardından dashboard.

---

# 26. PUBLIC PROFILE UX

QR kullanıcıları nedeniyle mobile-first tasarla.

Above-the-fold:

```text
LOGO

Şirket Adı
Kısa Açıklama

[ Ara ]
[ WhatsApp ]
[ Web ]
[ Yol Tarifi ]
```

Sonrasında bölümler.

Sayfanın tamamı hızlı açılmalıdır.

Public profile açılması authentication istememelidir.

---

# 27. ERROR STATES

Minimum uygun ekranlar oluştur:

```text
QR bulunamadı
Şirket kartı henüz yayınlanmamış
Şirket kartı geçici olarak pasif
OTP geçersiz
OTP süresi dolmuş
Rate limit
Unauthorized
Forbidden
```

Raw exception kullanıcıya gösterme.

---

# 28. TEST STRATEGY

Unit + integration test oluştur.

Kritik testler:

```text
OTP generate
OTP verify
OTP expire
OTP reuse blocked
OTP max attempts

Organization isolation

Company create
Company update
Company publish

Public profile only visible fields

QR redirect
Invalid QR
Suspended QR

Analytics event creation

vCard generation
```

Özellikle aşağıdaki test zorunlu:

```text
User A / Organization A

Company A'yı okuyabilir.

User A'nın Company B / Organization B id'si ile endpoint çağırması:

403 veya 404

ve hiçbir data leakage yok.
```

---

# 29. FAZ YÖNETİMİ

Projeyi tek seferde kontrolsüz biçimde geliştirme.

Aşağıdaki fazlar sırayla uygulanmalıdır.

---

## FAZ 0 — Repository + Architecture

Yap:

* mevcut repo varsa analiz et
* teknoloji stack belirle
* folder architecture
* ENV
* DB connection
* Docker
* lint
* TypeScript
* baseline test

PASS:

```text
install PASS
lint PASS
typecheck PASS
build PASS
database connectivity PASS
```

PASS olmadan FAZ 1'e geçme.

---

## FAZ 1 — Passwordless Authentication

Yap:

* user
* OTP
* mail service abstraction
* request-code
* verify-code
* session
* logout
* rate limit

Test et.

PASS ise commit:

```text
feat(auth): add passwordless email OTP authentication
```

Sonra otomatik FAZ 2.

---

## FAZ 2 — Multi-Tenant Core

Yap:

* Organization
* Membership
* Company
* authorization
* organization isolation

Integration test zorunlu.

PASS commit:

```text
feat(core): add multi-tenant organization and company model
```

Sonra FAZ 3.

---

## FAZ 3 — Company Builder

Yap:

* company information
* contact
* locations
* social
* custom fields
* visibility

PASS commit:

```text
feat(company): add digital company profile builder
```

---

## FAZ 4 — Public Digital Card

Yap:

```text
/c/[slug]
```

* mobile-first
* visible fields
* actions
* SEO
* vCard

PASS commit:

```text
feat(profile): add public digital company card
```

---

## FAZ 5 — QR Engine

Yap:

* QRCode
* unique publicCode
* /q/[code]
* redirect
* PNG
* SVG

QR'nin gerçek QR olduğunu programmatically validate et.

PASS commit:

```text
feat(qr): add permanent company QR engine
```

---

## FAZ 6 — Card Design

Yap:

* themes
* colors
* section visibility
* section ordering
* preview

PASS commit:

```text
feat(design): add company card customization
```

---

## FAZ 7 — Analytics

Yap:

* events
* QR scan
* public profile actions
* dashboard metrics

PASS commit:

```text
feat(analytics): add QR and profile interaction analytics
```

---

## FAZ 8 — Platform Admin

Yap:

* organizations
* companies
* users
* QR
* suspend/reactivate
* usage
* audit

PASS commit:

```text
feat(admin): add A6 platform administration
```

---

## FAZ 9 — Subscription Foundation

Yap:

* Package
* Subscription
* Entitlement
* limit enforcement

Payment provider bağlama.

PASS commit:

```text
feat(subscription): add SaaS package and entitlement foundation
```

---

## FAZ 10 — Security Audit

Kontrol et:

* tenant isolation
* OTP security
* rate limits
* session
* upload
* authorization
* XSS
* public field leakage
* production secrets

Bulduğun açıkları düzelt.

PASS commit:

```text
fix(security): harden A6 production security
```

---

## FAZ 11 — Production Deployment

Hazırla:

* production Docker image
* migrations
* health endpoint
* logging
* SMTP config
* database config
* HTTPS
* domain
* backup strategy

Domain:

```text
a6.com.tr
www.a6.com.tr
```

Production credentials source code'a commit edilmemeli.

---

## FAZ 12 — PRODUCTION SMOKE TEST

Gerçek workflow test et:

```text
1. a6.com.tr aç
2. gerçek e-mail gir
3. OTP al
4. OTP ile giriş yap
5. organization oluştur
6. company oluştur
7. logo yükle
8. telefon ekle
9. WhatsApp ekle
10. website ekle
11. merkez adresi ekle
12. depo adresi ekle
13. VKN ekle
14. VKN visibility değiştir
15. social media ekle
16. profile publish et
17. QR üret
18. QR PNG indir
19. QR SVG indir
20. gerçek telefon ile QR okut
21. /q/... çalışıyor mu kontrol et
22. public company profile açılıyor mu
23. telefon action çalışıyor mu
24. WhatsApp action çalışıyor mu
25. website action çalışıyor mu
26. directions çalışıyor mu
27. vCard indiriliyor mu
28. analytics QR_SCAN görüyor mu
29. analytics actions görüyor mu
30. logout yap
31. yeniden OTP ile login ol
32. company bilgisi değiştir
33. ESKİ QR'ı tekrar okut
34. yeni bilgi gösteriliyor mu doğrula
```

Son madde özellikle kritik:

**Company bilgisi değişmesine rağmen daha önce oluşturulan/basılan QR çalışmaya devam etmelidir.**

---

# 30. FAZ ÇALIŞMA KURALI

Her FAZ sonunda şu formatta rapor ver:

```text
FAZ X — PASS / FAIL

Yapılanlar:
...

Değişen dosyalar:
...

Database:
...

Test:
...

Security:
...

Build:
...

Commit:
...
```

FAIL varsa:

* problemi tespit et
* düzelt
* testleri tekrar çalıştır

PASS olmadan sonraki FAZ'a geçme.

PASS ise kullanıcıdan tekrar onay beklemeden bir sonraki FAZ'a devam et.

Ancak:

* production deploy
* production database destructive operation
* DNS destructive change

gibi geri dönüşü riskli operasyonlarda mevcut ortamı önce analiz et ve veri kaybı yaratma.

---

# 31. SCOPE CONTROL

Bu proje sırasında yeni ürünler icat etme.

V1 dışı:

* CRM
* e-commerce
* accounting
* internal chat
* advanced CMS
* mobile app
* marketing automation
* NFC management
* custom domains

oluşturma.

Kod mimarisi ileride bunları destekleyebilir ancak mevcut FAZ'ları genişletme.

---

# 32. FINAL ACCEPTANCE

Proje ancak aşağıdaki durumda tamamlanmış kabul edilir:

```text
a6.com.tr reachable
HTTPS PASS

real OTP e-mail PASS

login PASS

tenant isolation PASS

company create PASS

company edit PASS

company publish PASS

public card PASS

QR creation PASS

QR phone scan PASS

permanent QR redirect PASS

PNG PASS

SVG PASS

vCard PASS

analytics PASS

logout/login PASS

security tests PASS

production build PASS
```

Son raporda:

```text
A6 PRODUCTION — PASS
```

yazmadan önce bütün maddeleri gerçekten doğrula.

Mock sonucu production PASS olarak raporlama.

Test edilmemiş bir işlemi PASS olarak işaretleme.
