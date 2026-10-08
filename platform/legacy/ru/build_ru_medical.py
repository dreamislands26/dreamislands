#!/usr/bin/env python3
# Builds static RU medical pages for dreamislands.ru (run ON the RU VPS 103.13.228.84):
#   /lechenie-v-kitae/                              pillar
#   /lechenie-v-kitae/kliniki/<slug>/               9 hospital pages
# + adds URLs to sitemap.xml, a block to llms.txt, a link block to 3 existing pages (idempotent).
# Backups: /root/backup_medical_20261006/. Existing pages are NOT overwritten except the 3 link insertions (backed up).
# Case form posts to https://dreamislands.org/api/bookings/public (request_type=medical_case, no payment).
import os, re, json, shutil, html

ROOT = "/var/www/dreamislands"
BACKUP = "/root/backup_medical_20261006"
SITE = "https://dreamislands.ru"
API = "https://dreamislands.org/api/bookings/public"
STORE = "https://xbzrtofanbrahasxbisf.supabase.co/storage/v1/object/public/properties/bm-network/"
os.makedirs(BACKUP, exist_ok=True)

def esc(s): return html.escape(s, quote=True)

CSS = """.gp{padding:6rem 0 4rem}.gc{max-width:900px;margin:0 auto;padding:0 2rem}.gbc{font-size:.8rem;color:var(--text-dim);margin-bottom:1rem}.gbc a{color:inherit;opacity:.8}.gey{font-size:.76rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--mint);margin-bottom:1rem}.gt{font-family:Optima,Georgia,serif;font-size:clamp(2rem,5vw,3rem);color:#fff;line-height:1.15;margin-bottom:1rem}.gl{font-size:1.1rem;color:var(--text);line-height:1.7;margin-bottom:2rem;border-left:3px solid var(--mint);padding-left:1.25rem}.gb h2{font-family:Optima,Georgia,serif;font-size:1.4rem;color:#fff;margin:2.5rem 0 .85rem}.gb p{font-size:1rem;color:var(--text);line-height:1.75;margin-bottom:1.1rem}.gb ul,.gb ol{padding-left:1.5rem;margin-bottom:1.25rem}.gb li{font-size:1rem;color:var(--text);line-height:1.7;margin-bottom:.4rem}.gb a{color:var(--mint)}.ghero{width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:14px;margin-bottom:1.5rem;display:block}.gprogs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem;margin:1.5rem 0}.gprog{background:var(--panel);border:1px solid rgba(174,225,192,.1);border-radius:10px;padding:1.25rem;text-decoration:none;display:block;transition:border-color .2s}.gprog:hover{border-color:rgba(174,225,192,.3)}.gprog__name{font-family:Optima,Georgia,serif;font-size:1rem;color:#fff;margin-bottom:.3rem}.gprog__meta{font-size:.8rem;color:rgba(174,225,192,.7);line-height:1.5}.gprice{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin:1.5rem 0}.gprice div{background:var(--panel);border:1px solid rgba(174,225,192,.2);border-radius:12px;padding:1.4rem}.gprice h3{font-family:Optima,Georgia,serif;color:#fff;font-size:1.1rem;margin-bottom:.4rem}.gprice .p{color:var(--mint);font-size:1.15rem;margin-bottom:.6rem}.gnote{font-size:.85rem;color:var(--text-dim);line-height:1.6}.gfaq{margin:2.5rem 0}.gfaq-item{border-bottom:1px solid rgba(174,225,192,.1);padding:1.25rem 0}.gfaq-q{font-size:1rem;font-weight:500;color:#fff;margin-bottom:.6rem}.gfaq-a{font-size:.95rem;color:var(--text);line-height:1.65}.gcta{background:var(--panel);border:1px solid rgba(174,225,192,.2);border-radius:12px;padding:2rem;margin:2.5rem 0}.gcta h2{margin-top:0!important}.gcta label{display:block;font-size:.85rem;color:var(--text-dim);margin:.9rem 0 .3rem}.gcta input[type=text],.gcta textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(174,225,192,.25);border-radius:8px;color:#fff;padding:.8rem 1rem;font:inherit}.gcta textarea{min-height:130px;resize:vertical}.gcta .chk{display:flex;gap:.6rem;align-items:flex-start;font-size:.82rem;color:var(--text-dim);margin-top:1rem}.gcta .btn{margin-top:1.2rem;cursor:pointer}.gcta .hp{position:absolute;left:-9999px}#caseMsg{margin-top:1rem;font-size:.9rem}.disc{font-size:.8rem;color:var(--text-dim);background:rgba(174,225,192,.04);border-radius:8px;padding:1rem 1.25rem;margin-top:2rem;line-height:1.6}"""

NAV = """<nav class="nav">
  <a href="/" class="nav__logo">DREAM ISLANDS</a>
  <ul class="nav__links">
    <li><a href="/programs/">Программы</a></li>
    <li><a href="/find/">Найти путешествие</a></li>
    <li><a href="/lechenie-v-kitae/">Лечение в Китае</a></li>
    <li><a href="/destinations/">Направления</a></li>
    <li><a href="/prozhivanie/">Проживание</a></li>
    <li><a href="/otzyvy/">Отзывы</a></li>
    <li><a href="/about/">О Dream Islands</a></li>
  </ul>
  <a href="/start/" class="nav__cta">Начать</a>
  <a href="/booking/" class="nav__cta nav__cta--sec">Проверить даты</a>
  <button class="nav__burger" aria-label="Меню"><span></span><span></span><span></span></button>
</nav>"""

FOOTER = """<footer class="footer">
  <div class="footer__top">
    <p class="footer__logo">DREAM ISLANDS</p>
    <p class="footer__desc">Подбор и организация оздоровительных программ в 7 странах Азии.</p>
    <a href="https://dreamislands.org" class="footer__partner" target="_blank" rel="noopener">Официальный партнёр: Dream Islands Travel</a>
    <a href="/programs/" class="footer__partner" style="opacity:.6">Все программы →</a>
  </div>
  <div class="footer__cols">
    <div class="footer__col">
      <h4>Юридическая информация</h4>
      <p>DREAM ISLANDS (0845560005471) является торговой маркой компании<br><strong>DREAM ISLANDS SOCIAL ENTERPRISE COMPANY LIMITED</strong></p>
      <p>66/8, Moo 2, Maret, Ko Samui, Surat Thani 84310, Thailand</p>
      <p style="margin-top:.75rem">Официальный партнёр и эксклюзивный дистрибьютор для региона RU/CIS:<br><strong>DREAM ISLANDS SIAM CO., LTD.</strong> (0845567002281)</p>
      <p><a href="https://dreamislands.org" target="_blank" rel="noopener" style="color:inherit;opacity:.7">dreamislands.org</a> &nbsp;/&nbsp; <a href="https://dreamislands.ru" target="_blank" rel="noopener" style="color:inherit;opacity:.7">dreamislands.ru</a></p>
    </div>
    <div class="footer__col">
      <h4>Отказ от ответственности</h4>
      <p>Dream Islands подбирает, организует и координирует программы. Мы не оказываем медицинских или психиатрических услуг и не являемся медицинским учреждением — медицинские услуги оказывают лицензированные клиники-партнёры. Dream Islands помогает отслеживать изменения, но не гарантирует улучшение состояния здоровья.</p>
      <p>Контент на нашем сайте носит исключительно информационный характер и не является медицинским советом или назначением. Перед принятием любых решений, связанных со здоровьем, проконсультируйтесь с вашим врачом.</p>
    </div>
    <div class="footer__col">
      <h4>Контакты</h4>
      <p><a href="https://wa.me/66811612662" target="_blank" rel="noopener" class="footer__contact">WhatsApp / Telegram +66 81 161 2662</a></p>
      <p style="margin-top:.75rem">Партнёрство / B2B / MICE<br><a href="mailto:b2b@dreamislands.ru" class="footer__contact">b2b@dreamislands.ru</a></p>
      <p style="margin-top:.75rem"><a href="https://t.me/dreamislandstravel" target="_blank" rel="noopener" class="footer__contact">Telegram</a> &nbsp;·&nbsp; <a href="https://instagram.com/dreamislands" target="_blank" rel="noopener" class="footer__contact">Instagram</a></p>
    </div>
  </div>
  <div class="footer__btm">
    <span>&copy; 2024&ndash;2026 Dream Islands &middot; Азия</span>
    <span>Куратор и дистрибьютор: <a href="https://dreamislands.org" target="_blank" rel="noopener" style="color:inherit;opacity:.7">Dream Islands Travel</a></span>
  </div>
</footer>"""

DISC = '<div class="disc">Dream Islands — организация по продвижению направлений и координации поездок. Мы не оказываем медицинских услуг и не являемся медицинским учреждением: диагноз и лечение осуществляют лицензированные клиники и врачи. Информация носит справочный характер и не является медицинским советом. Результат лечения не гарантируется.</div>'

FORM_JS = """<script>
(function(){
var f=document.getElementById('caseForm'); if(!f) return;
var msg=document.getElementById('caseMsg');
f.addEventListener('submit',function(e){
  e.preventDefault();
  if(f.website.value) return; // honeypot
  var name=f.guest_name.value.trim(), contact=f.contact.value.trim(), cs=f.case_summary.value.trim();
  if(!name||!contact||cs.length<10||!f.consent.checked){ msg.style.color='#f2b8b5'; msg.textContent='Заполните имя, контакт, опишите случай (не короче 10 символов) и подтвердите согласие.'; return; }
  var q=new URLSearchParams(location.search);
  var p={request_type:'medical_case',guest_name:name,case_summary:cs,pax:1,destination_country:'China',market_country:'RU',
    source_page:location.pathname,utm_source:q.get('utm_source')||undefined,utm_medium:q.get('utm_medium')||undefined,utm_campaign:q.get('utm_campaign')||undefined};
  if(contact.indexOf('@')>-1){p.guest_email=contact}else{p.guest_whatsapp=contact}
  if(f.dataset.propertyId){p.property_id=f.dataset.propertyId;p.property_name=f.dataset.propertyName}
  var b=f.querySelector('button'); b.disabled=true; msg.style.color=''; msg.textContent='Отправляем…';
  fetch('__API__',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
   .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
   .then(function(x){ if(x.ok&&x.j.success){ f.style.display='none'; msg.style.color='var(--mint)'; msg.textContent='Спасибо! Мы получили ваш запрос. Команда рассмотрит случай и свяжется с вами по указанному контакту. Оплата на этом этапе не требуется.'; } else { b.disabled=false; msg.style.color='#f2b8b5'; msg.textContent=(x.j&&x.j.error)||'Не удалось отправить. Напишите нам в WhatsApp.'; } })
   .catch(function(){ b.disabled=false; msg.style.color='#f2b8b5'; msg.textContent='Не удалось отправить. Напишите нам в WhatsApp: +66 81 161 2662.'; });
});
})();
</script>""".replace("__API__", API)

def case_form(property_id=None, property_name=None, heading="Отправить медицинский запрос"):
    attrs = ""
    if property_id:
        attrs = ' data-property-id="%s" data-property-name="%s"' % (esc(property_id), esc(property_name or ""))
    return ('<div class="gcta" id="case"><h2>%s</h2>'
            '<p class="gnote">Опишите случай своими словами: что нужно (консультация, второе мнение, обследование, операция), основной диагноз или симптомы, предпочтительный город или клинику. Не указывайте номера паспорта и других документов. Подбор клиники и стоимость подтверждаются после разбора случая; оплата на этом этапе не требуется.</p>'
            '<form id="caseForm"%s novalidate>'
            '<label for="cf_name">Ваше имя</label><input type="text" id="cf_name" name="guest_name" autocomplete="name">'
            '<label for="cf_contact">Email или WhatsApp / Telegram</label><input type="text" id="cf_contact" name="contact" autocomplete="off">'
            '<label for="cf_case">Ваш случай</label><textarea id="cf_case" name="case_summary" maxlength="4000"></textarea>'
            '<input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">'
            '<label class="chk"><input type="checkbox" name="consent"> <span>Я согласен(на) на обработку введённых данных для рассмотрения запроса. <!-- LEGAL: текст согласия и ссылку на политику конфиденциальности утвердить до запуска рекламы --></span></label>'
            '<button type="submit" class="btn btn-mint">Отправить медицинский запрос →</button>'
            '<div id="caseMsg" role="status"></div></form></div>') % (esc(heading), attrs)

def page(title, desc, path, body, jsonld, og_image=None, extra_head=""):
    url = SITE + path
    ld = extra_head + "".join('<script type="application/ld+json">%s</script>' % json.dumps(j, ensure_ascii=False) for j in jsonld)
    og = '<meta property="og:image" content="%s">' % esc(og_image) if og_image else ""
    return ('<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s</title><meta name="description" content="%s"><link rel="canonical" href="%s">'
            '<meta property="og:type" content="website"><meta property="og:title" content="%s"><meta property="og:description" content="%s"><meta property="og:url" content="%s"><meta property="og:site_name" content="Dream Islands">%s'
            '<link rel="icon" type="image/png" href="/favicon.png"><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="/css/v4.css"><style>%s</style>%s</head><body>%s'
            '<main class="gp"><div class="gc">%s</div></main>%s%s<script src="/js/api.js"></script></body></html>') % (
        esc(title), esc(desc), url, esc(title), esc(desc), url, og, CSS, ld, NAV, body, FOOTER, FORM_JS)

def faq_html(items):
    return '<div class="gfaq"><h2>Вопросы и ответы</h2>' + "".join(
        '<div class="gfaq-item"><div class="gfaq-q">%s</div><div class="gfaq-a">%s</div></div>' % (esc(q), esc(a)) for q, a in items) + '</div>'

def faq_ld(items):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}

def bc_ld(trail):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p} for i, (n, p) in enumerate(trail)]}

PRICE_BLOCK = ('<div class="gprice">'
  '<div><h3>Ускоренная организация амбулаторного визита</h3><div class="p">3 500 RMB (≈ $521)</div>'
  '<p class="gnote">Консультация специалиста или обследования без госпитализации. В пакет входят: онлайн-предконсультация 30 минут (предварительная оценка потребностей и подбор маршрута, это не второе медицинское мнение), первичный разбор состояния и желаемых сроков, подбор клиники, отделения и специалиста, двуязычное сопровождение в клинике (полный день, до двух дней), запись к специалисту, приоритетная организация обследований, один бесплатный трансфер из аэропорта или с вокзала по городу, базовая коммуникация со страховой и организация документов для страховой, ведение случая.</p></div>'
  '<div><h3>Полное сопровождение операции</h3><div class="p">от 18 000 RMB (от ≈ $2 679)</div>'
  '<p class="gnote">Включает базовый пакет, подбор специалиста, поддержку предоперационных обследований, назначение операции, помощь при госпитализации, сопровождение в стационаре, послеоперационные рекомендации и сопровождение по лекарствам. Сложные случаи (онкология, нейрохирургия, редкие заболевания) организуются индивидуально через разбор случая.</p></div></div>'
  '<p class="gnote">Это только стоимость сервиса. Расходы клиники (консультации, диагностика, операция, лекарства) оплачиваются отдельно, если индивидуальное предложение не указывает иное. Цена в RMB — исходная, USD указан приблизительно по курсу 6,72. Результат лечения не гарантируется.</p>')

NETWORK_ID = "be89f687-8dd8-49fb-bbdf-11de13935ae0"

HOSP = [
 # slug_en, ru_slug, ru_name, en_name, city, desc, image file, property_id
 ("fudan-zhongshan-hospital","bolnitsa-chzhunshan-shanhaj","Больница Чжуншань Фуданьского университета","Zhongshan Hospital, Fudan University","Шанхай","Одна из ведущих университетских клиник Китая. Специализация: онкология, кардиология, гепатология.","fudan-zhongshan-hospital-05","778b763d-f466-4d1a-a723-ce98164cf9e9"),
 ("peking-union-medical-college-hospital","bolnitsa-syanhe-pekin","Больница Сяньхэ Пекинского союзного медицинского колледжа","Peking Union Medical College Hospital","Пекин","Одна из самых престижных клиник Китая. Специализация: редкие заболевания, диагностика, онкология.","peking-union-medical-college-hospital-04","e696f955-93ca-472a-92dc-bc60929ac3e4"),
 ("shanghai-jiaotong-ruijin-hospital","bolnitsa-zhujczin-shanhaj","Больница Жуйцзинь Шанхайского университета Цзяо Тун","Ruijin Hospital, Shanghai Jiao Tong University","Шанхай","Одна из старейших и авторитетнейших клиник Китая. Специализация: гематология, кардиология.","shanghai-jiaotong-ruijin-hospital-10","53dc1af0-9e10-4a8e-9c9b-518b5ec8a913"),
 ("shanghai-jiahui-international-hospital","bolnitsa-jiahui-shanhaj","Международная больница Jiahui, Шанхай","Shanghai Jiahui International Hospital","Шанхай","Первоклассная международная больница Шанхая. Западные стандарты медицины, русскоязычный сервис.","shanghai-jiahui-international-hospital-04","871ca861-cd36-421b-bc0a-1f9e84df1591"),
 ("peking-university-first-hospital","pervaya-bolnitsa-pekinskogo-universiteta","Первая больница Пекинского университета","Peking University First Hospital","Пекин","Ведущая клиника Пекинского университета. Широкий спектр медицинских специализаций.","peking-university-first-hospital-09","0377c946-b533-4b72-a6f7-2351565e20f6"),
 ("peking-university-international-hospital","mezhdunarodnaya-bolnitsa-pekinskogo-universiteta","Международная больница Пекинского университета","Peking University International Hospital","Пекин","Международная клиника Пекинского университета с сервисом для иностранных пациентов.","peking-university-international-hospital-06","d990737d-abee-4c7d-99de-b92a6af59081"),
 ("sichuan-university-west-china-hospital","bolnitsa-zapadnogo-kitaya-chendu","Больница Западного Китая Сычуаньского университета","West China Hospital, Sichuan University","Чэнду","Крупнейшая клиника Западного Китая. Специализация: нейрохирургия, онкология, кардиология.","sichuan-university-west-china-hospital-01","92263dd2-f90b-4ce7-822c-a9af02b150b9"),
 ("sun-yat-sen-university-affiliated-hospital","bolnitsa-sun-yatsena-guanchzhou","Аффилированная больница Университета Сунь Ятсена","Sun Yat-sen University Affiliated Hospital","Гуанчжоу","Ведущая клиника Южного Китая. Широкий спектр специализаций, современное оборудование.","sun-yat-sen-university-affiliated-hospital-01","687ee84e-c67f-4f4f-9e26-6f36105d9884"),
 ("xian-international-medical-center","mezhdunarodnyj-medcentr-sian","Международный медицинский центр Сиань","Xi'an International Medical Center","Сиань","Крупный международный медицинский центр в историческом Сиане. Диагностика и лечение международного уровня.","xian-international-medical-center-01","8fbd0bfd-44f8-4bed-8953-26727396cb33"),
]

def hosp_url(h): return "/lechenie-v-kitae/kliniki/%s/" % h[1]
def hosp_img(h): return STORE + h[0] + "/" + h[6] + ".webp"

PILLAR_FAQ = [
 ("Сколько стоит лечение в Китае для иностранца?", "Сервис Dream Islands и Better Migrate начинается от 3 500 RMB (≈ $521) за организацию амбулаторного визита и от 18 000 RMB (от ≈ $2 679) за сопровождение операции. Расходы клиники оплачиваются отдельно и зависят от случая; индивидуальная стоимость подтверждается после разбора случая."),
 ("Вы проводите лечение?", "Нет. Диагноз и лечение осуществляют лицензированные клиники и врачи. Dream Islands и Better Migrate организуют маршрут: подбор клиники и врача, запись, сопровождение и связь после лечения."),
 ("В какие клиники Китая можно попасть?", "Партнёрская сеть включает клиники в Пекине, Шанхае, Сиане, Чэнду и Гуанчжоу (список выше). Конкретная клиника выбирается после разбора случая; наличие мест и специалистов подтверждается по каждому случаю."),
 ("Нужно ли знать китайский язык?", "Нет. Двуязычное сопровождение в клинике входит в состав сервиса."),
 ("Можно ли получить второе мнение до поездки?", "Да, дистанционное второе мнение возможно: медицинские документы рассматривает непосредственно подходящая клиника в Китае. Dream Islands и Better Migrate координируют передачу кейса и не выступают медицинским экспертом. Отправьте медицинский запрос, и мы подтвердим следующие шаги, в том числе как передать документы. Срок, стоимость и формат ответа подтверждаются по каждому случаю."),
 ("Гарантируете ли вы результат лечения?", "Нет. Результат лечения не гарантируется: диагноз, план и исход определяют лечащие врачи клиники."),
]

HOSP_FAQ = [
 ("Как попасть на приём в эту клинику иностранному пациенту?", "Отправьте медицинский запрос со страницы. Команда разберёт случай, подберёт отделение и специалиста, подтвердит наличие мест и стоимость сервиса и организует запись и сопровождение."),
 ("Сколько стоит сервис?", "Организация амбулаторного визита — 3 500 RMB (≈ $521), сопровождение операции — от 18 000 RMB (от ≈ $2 679). Расходы клиники оплачиваются отдельно; точная стоимость подтверждается после разбора случая."),
 ("Нужно ли знать китайский язык?", "Нет, двуязычное сопровождение в клинике входит в состав сервиса."),
]

def build_pillar():
    path = "/lechenie-v-kitae/"
    title = "Лечение в Китае: медицинские туры и клиники | Dream Islands"
    desc = "Лечение в Китае для иностранцев: подбор клиники и врача, запись к специалистам, сопровождение на двух языках, организация операции. Сервис от 3 500 RMB."
    cards = "".join('<a class="gprog" href="%s"><div class="gprog__name">%s</div><div class="gprog__meta">%s, Китай<br>%s</div></a>' % (
        hosp_url(h), esc(h[2]), esc(h[4]), esc(h[5])) for h in HOSP)
    body = (
      '<div class="gbc"><a href="/">Главная</a> / Лечение в Китае</div>'
      '<div class="gey">Медицина в Китае</div><h1 class="gt">Медицинский туризм и лечение в Китае</h1>'
      '<p class="gl">Dream Islands и Better Migrate организуют лечение в Китае для иностранных пациентов: от разбора случая до наблюдения после лечения. Подбираем клинику, отделение и врача, записываем на приём, сопровождаем в больнице на двух языках и остаёмся на связи. Диагноз и лечение осуществляют лицензированные клиники и врачи.</p>'
      '<p><a href="#case" class="btn btn-mint">Отправить медицинский запрос →</a> &nbsp; <a href="https://wa.me/66811612662" class="btn" target="_blank" rel="noopener">Задать вопрос координатору</a></p>'
      '<div class="gb">'
      '<h2>Как проходит лечение в Китае через координатора</h2><ol>'
      '<li><strong>Запрос.</strong> Вы описываете случай: диагноз или симптомы и что нужно (консультация, второе мнение, обследование, операция).</li>'
      '<li><strong>Разбор случая.</strong> Подбираем клинику, отделение и специалиста.</li>'
      '<li><strong>Объём и стоимость.</strong> Подтверждаем индивидуальное предложение до любого бронирования.</li>'
      '<li><strong>Поездка и запись.</strong> Записи на приём, отель рядом с клиникой, трансфер (уточняются по случаю). Требования к визе зависят от гражданства и цели поездки и уточняются при разборе случая.</li>'
      '<li><strong>Сопровождение.</strong> Двуязычное сопровождение в клинике, обследования, при необходимости организация операции и госпитализации.</li>'
      '<li><strong>После лечения.</strong> Связь с клиникой и документы для страховой компании.</li></ol>'
      '<h2>Стоимость сервиса</h2>' + PRICE_BLOCK +
      '<p>Подробнее о форматах на английском: <a href="https://dreamislands.org/programs/bm-package-a-outpatient-fast-track" rel="noopener">Outpatient Fast-track</a> · <a href="https://dreamislands.org/programs/bm-package-b-surgery-full-process" rel="noopener">Surgery Full-process</a>.</p>'
      '<h2>Клиники-партнёры в Пекине, Шанхае, Сиане, Чэнду и Гуанчжоу</h2>'
      '<p>Описания предоставлены партнёрами (по данным партнёра). Конкретная клиника выбирается после разбора случая.</p>'
      '<div class="gprogs">' + cards + '</div>'
      '<h2>Что входит и что не входит в сервис</h2>'
      '<p><strong>Входит в сервисный сбор:</strong> онлайн-предконсультация 30 минут (предварительная оценка и маршрут), подбор клиники, отделения и специалиста, запись к специалисту, регистрация и идентификация пациента, двуязычное сопровождение в клинике, помощь с оплатой, обследованиями и аптекой, один бесплатный трансфер из аэропорта или с вокзала по городу, базовые документы для страховой, ведение случая. Состав подтверждается в индивидуальном предложении.</p>'
      '<p><strong>Не входит:</strong> расходы клиники (консультации, диагностика, операция, лекарства), перелёт, визовые сборы, проживание. Они оплачиваются отдельно.</p>'
      '<p>Для юридических лиц: официальные счета с НДС, оплата банковским переводом.</p>'
      '<h2>Дополнительные услуги</h2>'
      '<p>Тарифы партнёра, финальная стоимость подтверждается в индивидуальном предложении: дополнительный трансфер из аэропорта или с вокзала — 300 RMB за раз; помощь с бронированием отеля рядом с клиникой — 100 RMB; устный перевод — 200 RMB в час; организация документов для страховой — 300 RMB за комплект; круглосуточная организация экстренного доступа к медицинской помощи — 1 500 RMB за раз; помощь с маршрутом поездки — по запросу. Сопровождение в клинике: амбулаторный визит до 4 часов — 600 RMB, полный день (8 часов) — 800 RMB, стационар и операция — 1 000 RMB в день.</p>'
      '<h2>Второе мнение до поездки</h2>'
      '<p>Дистанционное второе медицинское мнение: ваши документы рассматривает непосредственно подходящая клиника в Китае. <a href="/lechenie-v-kitae/gidy/vtoroe-mnenie/">Как это работает →</a></p>'
      '</div>' + faq_html(PILLAR_FAQ) + case_form(NETWORK_ID, "Better Migrate Medical Network") + DISC)
    ld = [
      {"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "url": SITE + path, "inLanguage": "ru",
       "about": "Лечение в Китае для иностранных пациентов", "publisher": {"@type": "Organization", "name": "Dream Islands", "url": SITE}},
      {"@context": "https://schema.org", "@type": "Service", "name": "Организация лечения в Китае для иностранных пациентов",
       "serviceType": "Медицинская координация (не медицинская услуга)", "areaServed": "CN", "provider": {"@type": "Organization", "name": "Dream Islands", "url": SITE},
       "offers": [
         {"@type": "Offer", "name": "Ускоренная организация амбулаторного визита", "price": "3500", "priceCurrency": "CNY"},
         {"@type": "Offer", "name": "Полное сопровождение операции (от)", "price": "18000", "priceCurrency": "CNY"}]},
      faq_ld(PILLAR_FAQ), bc_ld([("Главная", "/"), ("Лечение в Китае", path)])]
    return path, page(title, desc, path, body, ld, hosp_img(HOSP[0]))

def build_hospital(h):
    path = hosp_url(h)
    short = h[2]
    title = "%s: лечение иностранных пациентов | Dream Islands" % short
    if len(title) > 75: title = "%s | Лечение иностранцев | Dream Islands" % short
    desc = ("%s (%s). %s Организация визита, запись и сопровождение для иностранных пациентов." % (short, h[4], h[5]))[:158]
    same_city = [x for x in HOSP if x[4] == h[4] and x[0] != h[0]]
    others = "".join('<li><a href="%s">%s</a></li>' % (hosp_url(x), esc(x[2])) for x in same_city) or ""
    body = (
      '<div class="gbc"><a href="/">Главная</a> / <a href="/lechenie-v-kitae/">Лечение в Китае</a> / %s</div>' % esc(short) +
      '<div class="gey">Клиника-партнёр · %s, Китай</div><h1 class="gt">%s</h1>' % (esc(h[4]), esc(short)) +
      '<img class="ghero" src="%s" alt="%s, %s" loading="eager">' % (hosp_img(h), esc(short), esc(h[4])) +
      '<p class="gl">%s <span class="gnote">Описание предоставлено партнёром (по данным партнёра).</span></p>' % esc(h[5]) +
      '<p><a href="#case" class="btn btn-mint">Отправить медицинский запрос →</a></p>'
      '<div class="gb"><h2>Как иностранному пациенту попасть в клинику</h2><ol>'
      '<li>Отправьте медицинский запрос: опишите случай и что вам нужно.</li>'
      '<li>Команда разберёт случай, подберёт отделение и специалиста и подтвердит наличие мест.</li>'
      '<li>Вы получите индивидуальное предложение с объёмом и стоимостью до любого бронирования.</li>'
      '<li>Организуем запись, обследования и двуязычное сопровождение в клинике.</li></ol>'
      '<h2>Стоимость сервиса</h2>' + PRICE_BLOCK +
      ('<h2>Другие клиники города</h2><ul>%s</ul>' % others if others else '') +
      '<h2>Все клиники-партнёры</h2><p><a href="/lechenie-v-kitae/">Лечение в Китае: клиники и медицинские туры →</a></p></div>' +
      faq_html(HOSP_FAQ) + case_form(h[7], h[3], "Отправить медицинский запрос: %s" % short) + DISC)
    ld = [
      {"@context": "https://schema.org", "@type": "Hospital", "name": short, "alternateName": h[3], "url": SITE + path,
       "address": {"@type": "PostalAddress", "addressLocality": h[4], "addressCountry": "CN"}, "image": hosp_img(h)},
      {"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "url": SITE + path, "inLanguage": "ru"},
      faq_ld(HOSP_FAQ), bc_ld([("Главная", "/"), ("Лечение в Китае", "/lechenie-v-kitae/"), (short, path)])]
    return path, page(title, desc, path, body, ld, hosp_img(h))

def write(path, content):
    full = ROOT + path + "index.html"
    os.makedirs(os.path.dirname(full), exist_ok=True)
    if os.path.exists(full):
        shutil.copy(full, BACKUP + "/" + path.strip("/").replace("/", "__") + ".index.html.bak")
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print("written", path)

SO_FAQ = [
 ("Кто рассматривает мои медицинские документы?", "Документы рассматривает непосредственно подходящая клиника в Китае. Dream Islands и Better Migrate координируют передачу кейса и не выступают медицинским экспертом."),
 ("Чем второе мнение отличается от онлайн-предконсультации на 30 минут?", "Онлайн-предконсультация входит в пакет сервиса и нужна для предварительной оценки потребностей и подбора маршрута. Это не второе медицинское мнение. Второе мнение даёт клиника по вашим медицинским документам."),
 ("Сколько стоит дистанционное второе мнение и как быстро придёт ответ?", "Стоимость, срок и формат ответа подтверждаются по каждому случаю после отправки запроса. Мы не называем их заранее."),
 ("Как передать документы?", "Отправьте медицинский запрос и кратко опишите случай. Не прикладывайте паспортные данные в форме. Мы подтвердим, как безопасно передать документы."),
 ("Гарантируете ли вы диагноз или результат лечения?", "Нет. Диагноз, план лечения и результат определяют врачи клиники. Мы не обещаем диагноз, заключение конкретного врача или исход лечения."),
]

def build_second_opinion():
    path = "/lechenie-v-kitae/gidy/vtoroe-mnenie/"
    title = "Второе медицинское мнение в Китае дистанционно | Dream Islands"
    desc = "Дистанционное второе медицинское мнение из клиники Китая: ваши документы рассматривает непосредственно подходящая клиника до решения о поездке на лечение."
    body = (
      '<div class="gbc"><a href="/">Главная</a> / <a href="/lechenie-v-kitae/">Лечение в Китае</a> / Второе мнение</div>'
      '<div class="gey">Дистанционное второе мнение</div><h1 class="gt">Дистанционное второе медицинское мнение из клиники Китая</h1>'
      '<p class="gl">Отправьте медицинские документы на рассмотрение непосредственно в подходящую клинику Китая до принятия решения о поездке на лечение. Dream Islands и Better Migrate координируют кейс; мнение даёт клиника.</p>'
      '<p><a href="#case" class="btn btn-mint">Отправить медицинский запрос →</a></p>'
      '<div class="gb">'
      '<h2>Как это работает</h2><ol>'
      '<li><strong>Вы отправляете запрос.</strong> Коротко опишите случай и что вы хотите получить.</li>'
      '<li><strong>Dream Islands и Better Migrate координируют кейс.</strong> Мы подтверждаем следующие шаги, в том числе как передать документы.</li>'
      '<li><strong>Клиника рассматривает документы.</strong> Документы рассматривает непосредственно подходящая клиника в Китае.</li>'
      '<li><strong>Вы получаете результат и решаете, что дальше.</strong> Если понадобится лечение или поездка, мы организуем следующий шаг через индивидуальное предложение.</li></ol>'
      '<h2>Кто за что отвечает</h2>'
      '<p>Dream Islands: приём запроса. Better Migrate: координация и передача кейса. Клиника в Китае: рассмотрение медицинского кейса. Вы: получаете результат и принимаете решение о дальнейшем лечении.</p>'
      '<h2>Что подтверждается по каждому случаю</h2>'
      '<p>Срок ответа, стоимость и формат результата определяются индивидуально после отправки запроса. Мы не обещаем диагноз, заключение конкретного врача или результат лечения.</p>'
      '<h2>Если решите ехать</h2>'
      '<p>Сервис по организации визита и сопровождения: <a href="/lechenie-v-kitae/">ускоренный амбулаторный визит от 3 500 RMB (≈ $521) и сопровождение операции от 18 000 RMB (от ≈ $2 679)</a>. Это только стоимость сервиса; расходы клиники оплачиваются отдельно.</p>'
      '</div>' + faq_html(SO_FAQ) + case_form(NETWORK_ID, "Better Migrate Medical Network", "Запросить дистанционное второе мнение") + DISC)
    ld = [
      {"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "url": SITE + path, "inLanguage": "ru"},
      faq_ld(SO_FAQ),
      bc_ld([("Главная", "/"), ("Лечение в Китае", "/lechenie-v-kitae/"), ("Второе мнение", path)])]
    hl = ('<link rel="alternate" hreflang="ru" href="%s%s">'
          '<link rel="alternate" hreflang="en" href="https://dreamislands.org/medical/china/guides/second-opinion-china">'
          '<link rel="alternate" hreflang="x-default" href="https://dreamislands.org/medical/china/guides/second-opinion-china">') % (SITE, path)
    return path, page(title, desc, path, body, ld, extra_head=hl)

pages = [build_pillar(), build_second_opinion()] + [build_hospital(h) for h in HOSP]
for p, c in pages:
    write(p, c)

# ---- sitemap.xml ----
sm_path = ROOT + "/sitemap.xml"
with open(sm_path, encoding="utf-8") as f:
    sm = f.read()
shutil.copy(sm_path, BACKUP + "/sitemap.xml.bak")
new = []
for p, _ in pages:
    loc = SITE + p
    if loc not in sm:
        pri = "0.9" if p == "/lechenie-v-kitae/" else "0.8"
        new.append("  <url><loc>%s</loc><lastmod>2026-10-06</lastmod><changefreq>monthly</changefreq><priority>%s</priority></url>" % (loc, pri))
if new:
    sm = sm.replace("</urlset>", "\n".join(new) + "\n</urlset>")
    with open(sm_path, "w", encoding="utf-8") as f:
        f.write(sm)
print("sitemap: +%d" % len(new))

# ---- llms.txt ----
ll_path = ROOT + "/llms.txt"
with open(ll_path, encoding="utf-8") as f:
    ll = f.read()
if "lechenie-v-kitae" not in ll:
    shutil.copy(ll_path, BACKUP + "/llms.txt.bak")
    block = "\n## Лечение в Китае для иностранцев\n- [Лечение в Китае: медицинские туры и клиники](%s/lechenie-v-kitae/) — организация лечения, запись к специалистам, двуязычное сопровождение; сервис от 3 500 RMB\n" % SITE
    block += "".join("- [%s](%s%s) — %s, Китай\n" % (h[2], SITE, hosp_url(h), h[4]) for h in HOSP)
    with open(ll_path, "w", encoding="utf-8") as f:
        f.write(ll.rstrip("\n") + "\n" + block)
    print("llms.txt updated")

# ---- link block into 3 existing pages ----
LINK = '<div style="max-width:1000px;margin:1rem auto 3rem;padding:0 2rem" data-medlink="1"><a href="/lechenie-v-kitae/" style="color:var(--mint)">Лечение в Китае: клиники и медицинские туры →</a></div>'
for rel in ("/destinations/better-migrate-medical-network/index.html", "/destinations/xian-international-medical-center/index.html", "/destinations/china/index.html"):
    fp = ROOT + rel
    if not os.path.exists(fp):
        print("skip (missing)", rel); continue
    with open(fp, encoding="utf-8") as f:
        s = f.read()
    if 'data-medlink="1"' in s:
        print("link already present", rel); continue
    if s.count("</main>") != 1:
        print("skip (no unique </main>)", rel); continue
    shutil.copy(fp, BACKUP + "/" + rel.strip("/").replace("/", "__") + ".bak")
    with open(fp, "w", encoding="utf-8") as f:
        f.write(s.replace("</main>", LINK + "</main>"))
    print("link added", rel)

if "gidy/vtoroe-mnenie" not in ll:
    with open(ll_path, encoding="utf-8") as f:
        t = f.read()
    with open(ll_path, "w", encoding="utf-8") as f:
        f.write(t.rstrip("\n") + "\n- [Дистанционное второе медицинское мнение из клиники Китая](%s/lechenie-v-kitae/gidy/vtoroe-mnenie/): документы рассматривает непосредственно клиника; Dream Islands и Better Migrate координируют\n" % SITE)
    print("llms.txt: second opinion added")

print("DONE. Check: https://dreamislands.ru/lechenie-v-kitae/")
