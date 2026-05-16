#!/usr/bin/env node
/**
 * 📥 سكربت تحميل صور مصحف المدينة ورفعها لـ Convex Storage.
 *
 * يعمل مرة واحدة فقط - بعدها الـ 604 صفحة محفوظة في Convex.
 *
 * 🚀 الاستخدام:
 *   1. تأكد إن Convex متصل (.env.local فيه CONVEX_URL + CONVEX_DEPLOYMENT)
 *   2. اعمل تسجيل دخول بإيميل أدمن في التطبيق وانسخ التوكن:
 *      - افتح http://localhost:8082 → سجل دخول
 *      - في المتصفح Console: localStorage.getItem('@nafahat/auth/token')
 *   3. شغل السكربت:
 *      ADMIN_TOKEN="tk_..." node scripts/upload-mushaf-pages.mjs
 *
 * 📦 المصدر:
 *   نستخدم مستودع GitHub عام للصور:
 *   https://github.com/baselsoft-com/quran-pages-15-lines
 *   عبر CDN jsDelivr للسرعة + CORS.
 *
 * ⏱️ المدة المتوقّعة: 15-30 دقيقة (يرفع 604 صورة بشكل تسلسلي)
 * 💾 الحجم المتوقع على Convex: ~30-50 MB
 */

import { ConvexHttpClient } from 'convex/browser';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// قراءة CONVEX_URL من .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local');
    const content = readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    console.warn('⚠️ .env.local غير موجود - استخدم متغيرات البيئة المباشرة');
  }
}

loadEnv();

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!CONVEX_URL) {
  console.error('❌ EXPO_PUBLIC_CONVEX_URL أو CONVEX_URL مش معرّف');
  console.error('   ضيفه في .env.local أو شغّل: EXPO_PUBLIC_CONVEX_URL=... node ...');
  process.exit(1);
}

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN مش معرّف');
  console.error('   شغّل: ADMIN_TOKEN="tk_xxx" node scripts/upload-mushaf-pages.mjs');
  console.error('');
  console.error('   لاستخراج التوكن:');
  console.error('   1. سجّل دخول بإيميل الأدمن في التطبيق');
  console.error('   2. في المتصفح Console:');
  console.error('      localStorage.getItem(\'@nafahat/auth/token\')');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// مصادر الصور - نجرّب بالترتيب
function getImageSources(pageNumber) {
  const n3 = String(pageNumber).padStart(3, '0');
  return [
    // jsDelivr GitHub - CORS-friendly
    `https://cdn.jsdelivr.net/gh/baselsoft-com/quran-pages-15-lines@main/pages/${n3}.png`,
    `https://cdn.jsdelivr.net/gh/iyadrz/mushaf-madinah-pages@master/pages/${n3}.png`,
    // EveryAyah
    `https://www.everyayah.com/data/images/quran/large/page${n3}.png`,
    `https://www.everyayah.com/data/images/quran/medium/page${n3}.png`,
    // searchtruth
    `https://www.searchtruth.com/quran/images2/large/page-${n3}.jpeg`,
  ];
}

async function downloadImage(pageNumber) {
  const sources = getImageSources(pageNumber);
  for (const url of sources) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || 'image/png';
        return { blob: new Blob([buf], { type: contentType }), source: url, contentType };
      }
    } catch (e) {
      // جرب المصدر التالي
    }
  }
  return null;
}

async function uploadPage(pageNumber) {
  // ١. تحميل الصورة
  const img = await downloadImage(pageNumber);
  if (!img) {
    throw new Error(`تعذّر تحميل الصفحة ${pageNumber} من كل المصادر`);
  }

  // ٢. الحصول على uploadUrl من Convex
  const uploadUrl = await client.mutation('mushafPages:generateUploadUrl', {
    token: ADMIN_TOKEN,
  });
  if (!uploadUrl) {
    throw new Error('فشل توليد uploadUrl - تأكد من token الأدمن');
  }

  // ٣. رفع الصورة لـ Convex Storage
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': img.contentType },
    body: img.blob,
  });
  if (!uploadRes.ok) {
    throw new Error(`فشل رفع الصفحة ${pageNumber}: HTTP ${uploadRes.status}`);
  }
  const { storageId } = await uploadRes.json();

  // ٤. حفظ المعرف في DB
  const result = await client.mutation('mushafPages:savePageImage', {
    page: pageNumber,
    storageId,
    token: ADMIN_TOKEN,
  });
  if (!result.ok) {
    throw new Error(`فشل حفظ DB للصفحة ${pageNumber}: ${result.error}`);
  }

  return img.source;
}

async function main() {
  console.log('📥 بدء رفع 604 صفحة من مصحف المدينة إلى Convex Storage...\n');
  console.log(`🔗 Convex: ${CONVEX_URL}\n`);

  // التحقق من إحصائيات البداية
  const initialStats = await client.query('mushafPages:getUploadStats', { token: ADMIN_TOKEN });
  if (!initialStats) {
    console.error('❌ مش قادر أتحقّق من حساب الأدمن - تأكد من ADMIN_TOKEN');
    process.exit(1);
  }
  console.log(`📊 الحالة الحالية: ${initialStats.uploaded}/604 صفحة مرفوعة`);
  console.log(`📋 الناقص: ${initialStats.missing} صفحة\n`);

  if (initialStats.missing === 0) {
    console.log('✅ كل الصفحات مرفوعة بالفعل!');
    return;
  }

  let success = 0;
  let failed = 0;
  const start = Date.now();
  const pagesToUpload = initialStats.missingPages.length > 0
    ? Array.from({ length: 604 }, (_, i) => i + 1).filter((p) => !pagesToUpload || initialStats.missingPages.includes(p))
    : Array.from({ length: 604 }, (_, i) => i + 1);

  for (let page = 1; page <= 604; page++) {
    process.stdout.write(`📄 الصفحة ${page}/604... `);
    try {
      const source = await uploadPage(page);
      success++;
      const percent = ((page / 604) * 100).toFixed(1);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`✅ (${percent}% - ${elapsed}s)`);
    } catch (e) {
      failed++;
      console.log(`❌ ${e.message}`);
    }
    // تأخير بسيط لمنع rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log('\n═══════════════════════════════════');
  console.log(`✅ نجح: ${success} صفحة`);
  console.log(`❌ فشل: ${failed} صفحة`);
  const minutes = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`⏱️ المدة: ${minutes} دقيقة`);
}

main().catch((e) => {
  console.error('❌ خطأ غير متوقع:', e);
  process.exit(1);
});
