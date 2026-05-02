#!/usr/bin/env node
/* eslint-disable */
/**
 * src/features/legal/content/{privacy,terms}.ts içindeki TR + EN metinleri
 * docs/ altında statik HTML sayfalarına dönüştürür.
 *
 * Çıktılar:
 *   docs/index.html        → Landing (uygulama tanıtımı + linkler)
 *   docs/privacy.html      → TR + EN sekmeli gizlilik politikası
 *   docs/terms.html        → TR + EN sekmeli kullanım koşulları
 *
 * Kullanım:
 *   npm run build:legal
 *
 * Sonra:
 *   git add docs && git commit -m "Update legal pages" && git push
 *   GitHub repo → Settings → Pages → Source: Deploy from branch (main, /docs)
 *   ~1 dakika sonra: https://<kullanici>.github.io/<repo>/privacy.html
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'features', 'legal', 'content');
const OUT_DIR = path.join(ROOT, 'docs');

// ----------------------------------------------------------------------------
// 1) TS dosyalarından template literal'leri çek
// ----------------------------------------------------------------------------

/** TS'den `export const NAME = \`...\`;` blok içeriğini ayıklar. */
function extractTemplate(srcFile, exportName) {
  const code = fs.readFileSync(srcFile, 'utf8');
  const startMarker = `export const ${exportName} = \``;
  const startIdx = code.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`Export not found: ${exportName} in ${srcFile}`);
  }
  const valueStart = startIdx + startMarker.length;
  const endIdx = code.indexOf('`;', valueStart);
  if (endIdx === -1) {
    throw new Error(`Closing backtick not found for ${exportName}`);
  }
  let body = code.slice(valueStart, endIdx);
  // ${...} interpolasyonlarını anında çöz (privacy/terms basit string interpolasyon kullanıyor)
  body = body.replace(/\$\{([A-Z_]+)\}/g, (match, name) => {
    const reConst = new RegExp(`export const ${name}\\s*=\\s*'([^']*)'`);
    const m = code.match(reConst);
    return m ? m[1] : match;
  });
  return body;
}

const privacySrc = path.join(SRC_DIR, 'privacy.ts');
const termsSrc = path.join(SRC_DIR, 'terms.ts');

const PRIVACY_TR = extractTemplate(privacySrc, 'PRIVACY_TR');
const PRIVACY_EN = extractTemplate(privacySrc, 'PRIVACY_EN');
const TERMS_TR = extractTemplate(termsSrc, 'TERMS_TR');
const TERMS_EN = extractTemplate(termsSrc, 'TERMS_EN');

// ----------------------------------------------------------------------------
// 2) Markdown → HTML (basit ama yeterli: h1/h2/h3, ul, p, link)
// ----------------------------------------------------------------------------

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(s) {
  // **bold**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // mailto: ya da http(s) link otomatik a-tag
  s = s.replace(/\b(https?:\/\/\S+)/g, '<a href="$1">$1</a>');
  s = s.replace(/\b([\w.+-]+@[\w-]+\.[\w.-]+)/g, '<a href="mailto:$1">$1</a>');
  return s;
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inList = false;
  let para = [];
  const flushPara = () => {
    if (para.length === 0) return;
    out.push(`<p>${inlineFormat(escapeHtml(para.join(' ').trim()))}</p>`);
    para = [];
  };
  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === '') {
      flushPara();
      closeList();
      continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      closeList();
      out.push(`<h1>${escapeHtml(line.slice(2).trim())}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      closeList();
      out.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      closeList();
      out.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
      continue;
    }
    if (line.startsWith('- ')) {
      flushPara();
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineFormat(escapeHtml(line.slice(2).trim()))}</li>`);
      continue;
    }
    para.push(line);
  }
  flushPara();
  closeList();
  return out.join('\n');
}

// ----------------------------------------------------------------------------
// 3) Layout
// ----------------------------------------------------------------------------

const COMMON_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0A0A0F;background:#fafafa}
body{max-width:760px;margin:0 auto;padding:24px 20px 64px;line-height:1.65}
header{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.logo{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#FF6B35,#C84618);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px}
.brand{font-weight:700;font-size:18px}
nav{display:flex;gap:16px;font-size:14px;margin:8px 0 24px;color:#666}
nav a{color:#FF6B35;text-decoration:none}
nav a:hover{text-decoration:underline}
.tabs{display:flex;gap:8px;margin:16px 0 8px;border-bottom:1px solid #e5e5e5;padding-bottom:0}
.tab{padding:10px 16px;border:none;background:none;font-size:14px;font-weight:600;color:#666;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.tab.active{color:#FF6B35;border-bottom-color:#FF6B35}
h1{font-size:28px;margin:24px 0 8px;line-height:1.25}
h2{font-size:20px;margin:28px 0 8px;line-height:1.3;color:#222}
h3{font-size:16px;margin:20px 0 4px;color:#444}
p{margin:8px 0}
ul{margin:6px 0 12px;padding-left:24px}
li{margin:4px 0}
a{color:#FF6B35}
.section{display:none}
.section.active{display:block}
footer{margin-top:48px;padding-top:24px;border-top:1px solid #e5e5e5;color:#888;font-size:13px;text-align:center}
@media (prefers-color-scheme: dark){
  html{color:#F2F2F7;background:#0A0A0F}
  h2{color:#E5E5E7}
  h3{color:#C7C7CC}
  .tabs{border-color:#333}
  .tab{color:#999}
  footer{border-color:#333;color:#666}
  nav{color:#999}
}
`.trim();

function tabsScript() {
  return `
<script>
(function(){
  var tabs=document.querySelectorAll('.tab');
  var sections=document.querySelectorAll('.section');
  tabs.forEach(function(btn){
    btn.addEventListener('click',function(){
      var lang=btn.dataset.lang;
      tabs.forEach(function(t){t.classList.toggle('active',t===btn)});
      sections.forEach(function(s){s.classList.toggle('active',s.dataset.lang===lang)});
      try{localStorage.setItem('legalLang',lang);}catch(e){}
    });
  });
  // ilk dil seçimi: localStorage > tarayıcı dili > tr
  var saved;try{saved=localStorage.getItem('legalLang');}catch(e){}
  var initial=saved||(navigator.language||'').toLowerCase().startsWith('tr')?'tr':(saved||'tr');
  var btn=document.querySelector('.tab[data-lang="'+initial+'"]')||document.querySelector('.tab');
  if(btn)btn.click();
})();
</script>
`.trim();
}

function layout({ title, body, includeTabs }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — MyFitCraft</title>
<meta name="description" content="MyFitCraft — fitness ve antrenman takip uygulaması.">
<style>${COMMON_CSS}</style>
</head>
<body>
<header>
  <div class="logo">M</div>
  <div class="brand">MyFitCraft</div>
</header>
<nav>
  <a href="./index.html">Ana sayfa</a>
  <a href="./privacy.html">Gizlilik</a>
  <a href="./terms.html">Koşullar</a>
</nav>
${body}
<footer>
  © ${new Date().getFullYear()} MyFitCraft · <a href="mailto:myfitcraft.app@gmail.com">myfitcraft.app@gmail.com</a>
</footer>
${includeTabs ? tabsScript() : ''}
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// 4) Build
// ----------------------------------------------------------------------------

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// privacy.html
const privacyBody = `
<div class="tabs" role="tablist">
  <button class="tab" data-lang="tr" role="tab">Türkçe</button>
  <button class="tab" data-lang="en" role="tab">English</button>
</div>
<article class="section" data-lang="tr">${mdToHtml(PRIVACY_TR)}</article>
<article class="section" data-lang="en">${mdToHtml(PRIVACY_EN)}</article>
`;
fs.writeFileSync(
  path.join(OUT_DIR, 'privacy.html'),
  layout({ title: 'Gizlilik Politikası', body: privacyBody, includeTabs: true }),
  'utf8',
);

// terms.html
const termsBody = `
<div class="tabs" role="tablist">
  <button class="tab" data-lang="tr" role="tab">Türkçe</button>
  <button class="tab" data-lang="en" role="tab">English</button>
</div>
<article class="section" data-lang="tr">${mdToHtml(TERMS_TR)}</article>
<article class="section" data-lang="en">${mdToHtml(TERMS_EN)}</article>
`;
fs.writeFileSync(
  path.join(OUT_DIR, 'terms.html'),
  layout({ title: 'Kullanım Koşulları', body: termsBody, includeTabs: true }),
  'utf8',
);

// index.html
const indexBody = `
<h1>MyFitCraft</h1>
<p>Antrenmanlarını planla, takip et, ilerlemeni gör. Kişisel rekorların, vücut ölçümlerin ve haftalık raporlarınla birlikte.</p>
<h2>Bağlantılar</h2>
<ul>
  <li><a href="./privacy.html">Gizlilik Politikası / Privacy Policy</a></li>
  <li><a href="./terms.html">Kullanım Koşulları / Terms of Use</a></li>
  <li><a href="./delete-account.html">Hesabımı Sil / Delete My Account</a></li>
  <li><a href="mailto:myfitcraft.app@gmail.com">Destek e-postası</a></li>
</ul>
<h2>Mağaza</h2>
<p>Yakında Google Play'de.</p>
`;
fs.writeFileSync(
  path.join(OUT_DIR, 'index.html'),
  layout({ title: 'MyFitCraft', body: indexBody, includeTabs: false }),
  'utf8',
);

// delete-account.html
const deleteBody = `
<div class="tabs" role="tablist">
  <button class="tab" data-lang="tr" role="tab">Türkçe</button>
  <button class="tab" data-lang="en" role="tab">English</button>
</div>

<article class="section" data-lang="tr">
<h1>MyFitCraft — Hesap Silme</h1>
<p>MyFitCraft hesabını ve tüm verilerini kalıcı olarak silmek için aşağıdaki adımları izle.</p>

<h2>Nasıl talep edilir?</h2>
<ol>
  <li><strong>E-posta gönder:</strong> <a href="mailto:myfitcraft.app@gmail.com?subject=Hesap%20Silme%20Talebi">myfitcraft.app@gmail.com</a> adresine, konu satırına <strong>"Hesap Silme Talebi"</strong> yazarak mail at.</li>
  <li><strong>Mail içeriği:</strong> Hesabını açtığın e-posta adresini ve "Hesabımın ve tüm verilerimin kalıcı olarak silinmesini talep ediyorum." cümlesini ekle.</li>
  <li><strong>Onay:</strong> 7 iş günü içinde sana onay maili gönderilir, hesabın silinir.</li>
</ol>

<h2>Hangi veriler silinir?</h2>
<ul>
  <li>Firebase Authentication kayıtları (e-posta, şifre)</li>
  <li>Profil bilgileri (ad, boy, kilo, hedef, dil tercihi)</li>
  <li>Tüm antrenman geçmişi (workouts, workout logs)</li>
  <li>Vücut ölçümleri (kilo, çevre, ölçüm tarihçesi)</li>
  <li>Kişisel rekorlar (PR'lar)</li>
  <li>Oluşturduğun özel programlar</li>
</ul>

<h2>Hangi veriler saklanır?</h2>
<ul>
  <li>Yasal yükümlülükler nedeniyle hiçbir kişisel veri 30 günden fazla saklanmaz.</li>
  <li>Sunucu erişim logları (anonim, IP yok) en fazla 30 gün tutulur, sonra otomatik silinir.</li>
</ul>

<p style="margin-top:24px;color:#9ba0a6;font-size:13px;">
Sorular için aynı adresten ulaşabilirsin: <a href="mailto:myfitcraft.app@gmail.com">myfitcraft.app@gmail.com</a>
</p>
</article>

<article class="section" data-lang="en">
<h1>MyFitCraft — Account Deletion</h1>
<p>Follow the steps below to permanently delete your MyFitCraft account and all associated data.</p>

<h2>How to request</h2>
<ol>
  <li><strong>Send an email:</strong> Email <a href="mailto:myfitcraft.app@gmail.com?subject=Account%20Deletion%20Request">myfitcraft.app@gmail.com</a> with the subject <strong>"Account Deletion Request"</strong>.</li>
  <li><strong>Email body:</strong> Include the email address you registered with, and the sentence: "I request the permanent deletion of my account and all associated data."</li>
  <li><strong>Confirmation:</strong> You will receive a confirmation email within 7 business days, after which your account is deleted.</li>
</ol>

<h2>What gets deleted</h2>
<ul>
  <li>Firebase Authentication record (email, password)</li>
  <li>Profile information (name, height, weight, goal, language preference)</li>
  <li>All workout history (workouts, workout logs)</li>
  <li>Body measurements (weight, circumferences, history)</li>
  <li>Personal records (PRs)</li>
  <li>Custom programs you created</li>
</ul>

<h2>What gets retained</h2>
<ul>
  <li>No personal data is retained beyond 30 days for legal obligations.</li>
  <li>Anonymized server access logs (no IPs) are kept for up to 30 days, then automatically purged.</li>
</ul>

<p style="margin-top:24px;color:#9ba0a6;font-size:13px;">
Questions? Reach us at <a href="mailto:myfitcraft.app@gmail.com">myfitcraft.app@gmail.com</a>
</p>
</article>
`;
fs.writeFileSync(
  path.join(OUT_DIR, 'delete-account.html'),
  layout({ title: 'Delete My Account / Hesabımı Sil', body: deleteBody, includeTabs: true }),
  'utf8',
);

console.log('✓ docs/index.html');
console.log('✓ docs/privacy.html');
console.log('✓ docs/terms.html');
console.log('✓ docs/delete-account.html');
console.log('\nSonraki adım:');
console.log('  git add docs && git commit -m "Add legal pages" && git push');
console.log('  Sonra GitHub repo → Settings → Pages → Source: Deploy from branch (main, /docs)');
