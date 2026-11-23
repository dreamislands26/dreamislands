# B16 · Team, hiring and AI decision rights (provided by Mark 2026-10-13, as is)

Source: Mark Semenov, attached during the vision interview, entry B16. Stored verbatim.

B16. Team, Hiring & AI Decision Rights
1. Команда сегодня
Текущая core team строится вокруг трёх функций.
Кто	Ownership	Что делает
Mark — Founder / Business & GTM	Demand, supply, monetization, fundraising	ICP, partnerships, bookings, commercial model, growth, fundraising, business/product direction
Oleg — Product	End-to-end product experience	Guest journey, Partner Cabinet, Wellness Product Builder, UX, product analytics, прототипирование
Dmitry — Technology / Data / AI	Architecture & intelligence layer	Data model, Supabase/backend architecture, permissions, integrations, AI architecture, BC/financial layer, Guest × Goal × Program × Outcome


Разделение ответственности:
Mark — what becomes a business
Oleg — what becomes a product people use
Dmitry — what becomes a scalable data/intelligence system

Отдельный operating layer — Cura / AI + Customer Success:
AI handles standard flow → Human handles exceptions, trust and high-value cases

2. Что должно перестать зависеть от Mark
Сейчас founder неизбежно находится внутри большого количества процессов. После финансирования цель — убрать Mark из регулярного исполнения:
partner onboarding
program creation
booking coordination
guest follow-ups
routine sales communication
reconciliation
content/data entry
Mark должен оставаться в:
Strategy | Key Partnerships | GTM | Economics | Fundraising | Senior Hiring | Major Exceptions

Если рост bookings требует пропорционально больше времени Mark, модель ещё не масштабируется.
3. Первые роли после финансирования
Я бы не строил большую команду. Первые hires должны закрывать bottlenecks вокруг существующей тройки.
#1 — Full-Stack / Product Engineer
Работает с Dmitry + Oleg.
Задача — превратить architecture/prototypes в production product:
Guest Product | Partner Cabinet | Product Builder | Booking Flow | Supabase | APIs | Integrations
Dmitry должен владеть architecture, а не становиться единственным человеком, который физически реализует весь продукт.
#2 — Partner Success / Supply Manager
Работает с Mark + Oleg.
Ownership:
Partner → Inventory → Standardized Programs → Live → Producing → Paying → Retained

Основные KPI:
Time-to-Live
Active Properties
Producing Properties
Paying Properties
Partner Retention
Это особенно важно после B15: кто-то должен помочь первым properties превратить их inventory в standardized wellness products и доказать willingness to pay.
#3 — Guest / Customer Success
Не обычный travel agent.
Человек принимает escalation от Cura:
complex request
tailor-made journey
documents
high-value guest
complaint
exception
partner coordination
Цель:
AI handles volume; Customer Success handles exceptions and trust.

По мере роста этот человек также становится источником structured feedback для Oleg/Dmitry: где automation ломается и почему.
Следующие hires — только после появления bottleneck
Growth / Performance — когда booking funnel уже конвертирует и есть смысл масштабировать acquisition.
Finance / Operations — когда GMV и количество settlements делают B13 существенным operational risk.
Data / ML — когда появляется достаточно Guest × Goal × Program × Outcome данных. Не нанимать ML-команду раньше data asset.
4. Что делает AI
AI может:
qualify leads → answer standard questions → collect guest requirements → recommend/match programs → collect partner information → structure inventory → draft programs → detect incomplete data → follow up → summarize → generate partner insights → detect anomalies → propose actions

Ключевое слово:
propose

Для ряда решений AI может действовать автоматически в рамках заранее определённых policies. Но не должен сам устанавливать или менять эти policies.
5. Какие решения AI не принимает никогда
Кроме уже определённой медицины, я бы установил пять hard boundaries.
Money
AI не должен самостоятельно:
- переводить деньги партнёру;
- делать discretionary refunds;
- менять commission;
- списывать задолженность;
- выдавать goodwill compensation;
- менять financial terms существующего booking.
Он может рассчитать и предложить действие. Движение денег и финансовые exceptions — authorized human approval.
Partner admission / removal
AI может провести screening, проверить completeness, credentials и выявить risk.
Но финальное:
Approve / Suspend / Remove Partner

принимает человек.
Особенно при safety, fraud, medical credentials или существенном quality incident.
Guest data & consent exceptions
AI не должен самостоятельно расширять доступ партнёра к guest data или решать:
«Наверное, эти данные можно показать property».

Permissions определяются policy + explicit consent.
Любое исключение — human/privacy approval.
Binding commercial / legal commitments
AI не должен самостоятельно:
- согласовывать индивидуальные contractual terms;
- менять cancellation liability;
- обещать compensation;
- принимать нестандартные partner obligations;
- делать юридически значимое исключение из policy.
AI может вести переговорный flow внутри заранее утверждённых boundaries, но не создавать новые обязательства компании.
Safety / serious disputes
При:
guest safety issue | suspected fraud | serious complaint | privacy incident | partner dispute | material financial discrepancy
AI:
Detect → Stop/hold where policy permits → Escalate

а не самостоятельно выносит окончательное решение.
6. Decision Model
Практически я бы зашил три уровня.
AUTO
Standard communication, matching, reminders, data collection, program drafting, routine workflow within approved rules.

AI PROPOSES → HUMAN APPROVES
Partner onboarding, financial exceptions, refunds outside fixed rules, contractual exceptions, sensitive-data exceptions, major booking changes.

HUMAN ONLY
Medicine, partner suspension/removal, material financial commitments, legal exceptions, serious safety/privacy/fraud incidents.

B16 Target Operating Model
AI runs the standard flow. Customer Success handles exceptions. Product and Technology define the system. Founder owns business decisions—not daily operations.

И первые три hires после финансирования:
Product Engineer → Partner Success → Customer Success

с последующим наймом Growth / Finance / Data только по мере появления соответствующего bottleneck.