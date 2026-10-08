#!/usr/bin/env node
/**
 * TANYA SAMUI — build_from_supabase.js
 * Тянет programs / program_variants / faq / reviews из Supabase
 * Генерирует статический HTML — без runtime-зависимости от БД на сайте.
 *
 * Запуск: set -a; . /root/dit_public.env; set +a; node build_from_supabase.js
 *         (нужны SUPABASE_URL и SUPABASE_KEY — публичный anon-ключ)
 * Результат: build/programs.html, build/faq.html, build/reviews.html
 *            + build/data.json (для ручной проверки)
 *
 * Когда обновлять контент в Supabase — просто перезапусти скрипт
 * и скопируй сгенерированные фрагменты в нужные секции index.html / faq/ / otzyvy/
 */

// Адрес проекта и публичный anon-ключ берутся из окружения и в репозитории не хранятся.
// Те же имена, что в /root/dit_public.env для build_ru_*.py.
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Задайте SUPABASE_URL и SUPABASE_KEY (публичный anon-ключ) в окружении перед запуском.');
  process.exit(1);
}

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchTable(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function thb(n) {
  if (n == null) return '—';
  return Math.round(n).toLocaleString('ru-RU');
}

// ── COHORT → имидж/тег маппинг (для карточек на сайте) ──────────
const COHORT_META = {
  1: { tag: 'Детокс · Печень · Энергия',  img: '/assets/img/prog-detox.webp',     code: 'RESET-01' },
  2: { tag: 'Вес · Метаболизм · Тело',    img: '/assets/img/prog-weight.webp',    code: 'RESET-06' },
  3: { tag: 'Выгорание · Стресс · Сон',   img: '/assets/img/prog-ns.webp',        code: 'RESET-05' },
  4: { tag: 'Спорт · Восстановление',     img: '/assets/img/prog-standard.webp',  code: 'RESET-02' },
  5: { tag: 'Долголетие · Биохакинг',     img: '/assets/img/prog-longevity.webp', code: 'RESET-04' },
  6: { tag: 'Кожа · Эстетика · Лицо',     img: '/assets/img/prog-estetika.webp',  code: 'BEAUTY' }
};

async function main() {
  console.log('→ Fetching from Supabase...');

  const [programs, variants, faqRows, reviews, services] = await Promise.all([
    fetchTable('programs?status=eq.published&order=cohort.asc'),
    fetchTable('program_variants?active=eq.true&order=duration_days.asc'),
    fetchTable('faq?status=eq.published&order=sort_order.asc'),
    fetchTable('reviews?status=eq.published&order=featured.desc'),
    fetchTable('services?active=eq.true&order=category.asc,sort_order.asc')
  ]);

  console.log(`  programs: ${programs.length}`);
  console.log(`  variants: ${variants.length}`);
  console.log(`  faq: ${faqRows.length}`);
  console.log(`  reviews: ${reviews.length}`);
  console.log(`  services: ${services.length}`);

  // ── Group variants by program_id ──
  const variantsByProgram = {};
  variants.forEach(v => {
    (variantsByProgram[v.program_id] ||= []).push(v);
  });

  // ── PROGRAMS HTML ──
  let programsHtml = '';
  programs.forEach(p => {
    const ru = p.translations?.ru || {};
    const meta = COHORT_META[p.cohort] || { tag: '', img: '/assets/img/prog-standard.webp', code: '' };
    const vs = (variantsByProgram[p.id] || []).sort((a, b) => a.duration_days - b.duration_days);
    const priceRow = vs.map(v => `<span>${v.duration_days}D — <strong>${thb(v.price_basic_thb)}</strong></span>`).join('\n              ');

    programsHtml += `
      <article class="prog-card">
        <img src="${meta.img}" alt="${esc(ru.name || p.name)}" class="prog-card__img" loading="lazy" width="380" height="190">
        <div class="prog-card__body">
          <div class="prog-card__cohort">${meta.code} · ${esc(ru.for_whom ? ru.for_whom.split('·')[0].trim() : '')}</div>
          <p class="prog-card__tag">${meta.tag}</p>
          <h3>${esc(ru.name || p.name)}</h3>
          <p>${esc(ru.short_description || ru.description || p.summary || '')}</p>
          <div class="prog-card__footer">
            <div class="prog-price-row">
              ${priceRow}
            </div>
          </div>
        </div>
      </article>
`;
  });

  // ── FAQ HTML ──
  let faqHtml = '';
  faqRows.forEach(f => {
    if (!f.question_ru || !f.answer_ru) return;
    faqHtml += `
      <div class="faq__item">
        <button class="faq__q" aria-expanded="false">${esc(f.question_ru)}<span class="faq__icon" aria-hidden="true">+</span></button>
        <div class="faq__a">${esc(f.answer_ru)}</div>
      </div>
`;
  });

  // ── REVIEWS HTML ──
  let reviewsHtml = '';
  reviews.forEach(r => {
    if (r.visibility === 'global') return; // RU site shows 'both' and 'tanyasamui_ru'
    const featClass = r.featured ? ' review-card--featured' : '';
    reviewsHtml += `
      <div class="review-card${featClass}">
        <div class="review-card__stars" aria-label="5 звёзд">★★★★★</div>
        <p class="review-card__text">«${esc(r.text_ru || r.text_en)}»</p>
        <div class="review-card__who">${esc((r.guest_name || '').split(' / ')[0])}</div>
        <div class="review-card__role">${esc((r.guest_title || '').split(' / ')[0])}</div>
        <div class="review-card__meta">
          <span class="review-card__cohort">${esc(r.duration || '')}</span>
          <span class="review-card__country">${esc((r.country || '').split('·').pop().trim())}</span>
        </div>
      </div>
`;
  });

  // ── SERVICES HTML (по категориям, как на сайте) ──
  const CATEGORY_LABELS = {
    massage: 'Массаж',
    mind: 'Холистика · Ум',
    beauty: 'Эстетика и IV-терапия',
    ritual: 'Ритуалы и сертификация',
    certification: 'Ритуалы и сертификация',
    medical: 'Bunya Clinic · Медицина',
    iv: 'Эстетика и IV-терапия'
  };
  const servicesByCategory = {};
  services.forEach(s => {
    const cat = CATEGORY_LABELS[s.category] || s.category;
    (servicesByCategory[cat] ||= []).push(s);
  });

  let servicesHtml = '';
  Object.entries(servicesByCategory).forEach(([catLabel, items]) => {
    const rows = items.map(s => {
      const ru = s.translations?.ru || {};
      const dur = s.duration_min ? ` · ${s.duration_min} мин` : '';
      return `          <div class="wb-row"><span>${esc(ru.name || s.name)}</span><span>${thb(s.price_thb)} THB${dur}</span></div>`;
    }).join('\n');
    servicesHtml += `
      <div class="wb-cat" data-category="${esc(catLabel)}">
        <h4 class="wb-cat__title">${esc(catLabel)} (${items.length})</h4>
        <div class="wb-list">
${rows}
        </div>
      </div>
`;
  });

  const fs = require('fs');
  fs.mkdirSync('build', { recursive: true });
  fs.writeFileSync('build/programs.html', programsHtml.trim());
  fs.writeFileSync('build/faq.html', faqHtml.trim());
  fs.writeFileSync('build/reviews.html', reviewsHtml.trim());
  fs.writeFileSync('build/services.html', servicesHtml.trim());
  fs.writeFileSync('build/data.json', JSON.stringify({ programs, variants, faqRows, reviews, services }, null, 2));

  console.log('\n✓ Готово. Файлы в build/:');
  console.log('  programs.html — вставить в <div class="programs__grid"> на index.html');
  console.log('  faq.html      — вставить в <div class="faq__list"> на faq/index.html');
  console.log('  reviews.html  — вставить в <div class="reviews-grid"> на otzyvy/index.html');
  console.log('  services.html — вставить в <div class="wb-grid"> на index.html');
  console.log('  data.json     — полный дамп для проверки');
}

main().catch(err => {
  console.error('✗ Ошибка:', err.message);
  process.exit(1);
});
