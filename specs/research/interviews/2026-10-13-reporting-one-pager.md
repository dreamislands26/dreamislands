# B14 · Reporting one-pager (provided by Mark 2026-10-13, as is)

Source: Mark Semenov, attached during the vision interview, entry B14. Stored verbatim.

B14. Учёт и отчёты
Как должно работать, когда сделано правильно
Dream Islands должен иметь один Founder / Investor Operating One-Pager, построенный на общей data model.
Не отдельные цифры для fundraising, operations, product и finance, а:
One data model → one source of truth → different views.

Основные две стороны бизнеса:
Traveler Network / B2C ↔ Property Network / B2B
между ними:
Journey / Booking / Outcome
TAB 1 — Traveler Network / B2C
Monthly North Star
Profiles | Bookings | GMV | DI Revenue | CVR | Avg Booking | Repeat Journey Rate | Active Properties | Outcome-Complete Journeys
Основной аналитический разрез
Не просто totals, а:
ICP × Cohort × Destination × Program

Здесь ICP — полноценный customer segment, который уже учитывает geography и другие характеристики гостя:
Origin Geography + Demographics + Life/Work Profile + Purchasing Power + Travel Behavior + Wellness Intent
Cohort — не новая придуманная для dashboard классификация. Используем существующие cohorts из Supabase как source of truth.
Основная таблица:
ICP	Cohort	Destination	Profiles	Bookings	CVR	GMV	DI Revenue	Avg Booking	Outcome	Repeat


Главный вопрос:
Which ICP × Cohort × Destination × Program combination produces the strongest conversion, economics, outcomes and repeat?

TAB 2 — Property Network / B2B
Monthly North Star
Total Properties | Connected | Active | Producing | Paying | B2B MRR | Guests Served | GMV Generated | Property Retention
Property funnel:
Onboarded → Connected → Active → Producing Guests → Paying B2B → Retained / Expanded

При этом Paying Properties становится настоящим North Star только после запуска standalone B2B monetization. До этого важнее:
Active Properties | Producing Properties | Guests per Property | GMV Generated
Property-level view
Property	Destination	Programs	Cohorts	Status	Guests	Bookings	GMV Generated	DI Revenue	B2B Revenue	Outcome	Retention


Здесь принципиально разделяем:
GMV Generated — сколько traveler business Dream Islands принёс property.
DI Transaction Revenue — сколько DI заработал на этих bookings.
B2B Revenue — сколько property непосредственно заплатил Dream Islands за SaaS / intelligence / platform services.
Общая Data Architecture
Supply
Destination → Property → Program → Cohort

Demand
Traveler → ICP → Wellness Profile → Journey

Transaction / Experience
Journey → Booking → Program → Property → Outcome → Next Journey

Journey связывает traveler intelligence с supply.
Минимальная модель:
Traveler_ID
ICP_ID
Wellness_Profile_ID
Journey_ID
Cohort_ID
Destination_ID
Property_ID
Program_ID
Booking_ID
GMV
DI_Revenue
Margin
Baseline_WS
Post_WS
Tracker_Signals
Outcome
Repeat_Journey_ID
Когорты берём из существующей структуры Supabase, а не создаём отдельный taxonomy специально для BI.
DATA ASSET
Третья строка One-Pager должна показывать не revenue, а накопление intelligence asset:
Profiles → Journeys → Tracked Journeys → Outcome-Complete Journeys → Longitudinal Data → Repeat Journeys

Основные показатели:
Total Wellness Profiles
Tracked Journeys / Total Journeys
Outcome-Complete / Completed Journeys
Profiles with Longitudinal Data
Repeat Journey Rate
Median Time to Next Journey
По мере подключения health trackers:
Connected Trackers | Consented Profiles | Profiles with Passive Signals
30/60/90 здесь могут существовать как measurement points, но не должны становиться отдельной продуктовой историей.
Какие вопросы должна отвечать система
Из одной data model Mark должен без ручной сборки получить ответы:
Какой ICP лучше всего конвертируется в конкретной когорте?

Какие ICP × Cohort × Destination дают лучший GMV и margin?

Какие programs дают лучшие outcomes?

Какие properties дают одновременно хорошие economics и outcomes?

Какие properties получают больше всего business от DI?

Какие cohorts имеют лучший repeat?

Есть ли связь между measurable improvement и repeat booking?

Какой следующий journey чаще всего следует после первого?

Это уже связывает acquisition → transaction → outcome → repeat.
Company One-Pager
В итоге Mark / investor видит три уровня.
COMPANY
GMV | DI Revenue | Travelers | Bookings | CVR | Avg Booking | Repeat | Active Properties | B2B MRR | Outcome-Complete Journeys

NETWORKS
Traveler Network
ICP → Cohort → Destination → Program → Booking → Economics → Outcome → Repeat

Property Network
Destination → Property → Program → Guests → GMV Generated → DI Revenue → B2B Revenue → Retention

DATA ASSET
Profiles → Journeys → Tracked → Outcomes → Longitudinal Signals → Repeat

Где смотрим сегодня
Сегодня полного Founder / Investor One-Pager ещё нет.
Текущая платформа/Supabase уже содержит базовые сущности properties, programs, guests/intake, bookings и cohorts. Отдельно существуют assessment/outcome и financial/operational данные.
Target B14 — не строить ещё один независимый dashboard, а связать существующие сущности в одну reporting layer.
Ownership
Mark — business definitions
ICP | Active Property | Producing Property | Repeat | GMV vs Revenue | Commercial KPIs
Dmitry — data & reporting architecture
Source of Truth | Entity Relationships | Metric Definitions | Financial Data | BI Layer | Data Quality
Oleg — product views
Founder Dashboard | Partner Dashboard | Analytics UX
И главное правило B14:
Investor reporting, internal BI and product analytics must calculate the business from the same underlying entities and definitions.