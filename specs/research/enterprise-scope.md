# Dream Islands Travel — Enterprise Platform Scope

Microsoft Business Central · 9 Workstreams · Task Tracker · 28 июля 2026

> Enterprise Scope · Dmitry Katson · Confidential.
> Converted from `DIT_Enterprise_Scope_Dmitry.docx`; the original file is in the git history.

> **Принцип разделения ответственности**
>
> Claude Code = скорость, проверка гипотез, MVP. Dmitry = архитектура, интеграции, корпоративная платформа, безопасность, масштабируемость, миграция.
>
> Работа не дублируется: MVP продолжает развиваться, параллельно строится путь к production на Business Central.

## Цель

Спроектировать production-архитектуру Dream Islands как корпоративной платформы.

Текущий MVP (сайт, WBS, CRM, партнёрский дашборд, booking flow) валидирует бизнес-модель. Следующая фаза — спроектировать масштабируемую операционную платформу, способную поддержать:

- тысячи гостей
- сотни партнёров
- несколько стран
- B2B и B2C
- AI recommendation engine
- финансовую отчётность
- партнёрские операции
- инвесторскую отчётность

### Контекст: где мы сейчас (данные из Supabase 28.07)

| Компонент | Состояние |
|---|---|
| Платформа | LIVE · panel.dreamislands.org |
| Объекты (properties) | 30 (Китай 12, Таиланд 6, Индонезия 4, Филиппины 3, SG 2, MY 2, VN 1) |
| Программы | 56 · 8 композитных · 382 связки программа-сервис |
| Сервисы | 136 |
| Гости | 24 в платформе (база 500+ вне платформы, не подтянута) |
| Брони | 11 · $10,580 объём |
| Backend | Supabase / PostgreSQL 17 |
| Партнёры onboarded | 2 (self-serve пока не реализован) |

## Workstream 1 — Enterprise Architecture

High-level архитектура, покрывающая:

| Компонент | Роль |
|---|---|
| Business Central | Finance, партнёрские контракты, операции, CRM, отчётность |
| Supabase | MVP-данные, WBS, real-time, edge functions |
| AI layer | WBS interpretation, recommendation, concierge |
| Partner Portal | Партнёрский дашборд, outcome-данные, self-serve |
| Customer Portal | User panel, journey history, WBS профиль |
| Public Website | Лендинги, booking flow, WBS форма |
| Booking Engine | Инвентарь, доступность, бронирование, депозиты |
| CRM | Организации, лиды, opportunities |
| Analytics | Revenue, margins, partner performance |
| Payment layer | Депозиты, комиссии, выплаты |
| Identity & Auth | Роли, партнёрская изоляция, медицинские данные |
| API layer | Версионирование, аутентификация, webhooks, события |

### Deliverables

- Architecture diagram
- Component responsibilities
- Integration map
- Data ownership

## Workstream 2 — Canonical Data Model

Спроектировать production модель данных. Core-домены:

| Домен | Сущности |
|---|---|
| Geography | Countries, Destinations |
| Supply | Partner Organizations, Properties, Clinics, Hospitals, Practitioners |
| Products | Programs, Variants, Activities, Tracks, Outcomes |
| Customers | Profiles, WBS, Goals, Preferences |
| Commerce | Bookings, Payments, Commissions, Invoices |
| Operations | Transfers, Concierge, Journey Timeline |
| Outcomes | Progress, Assessments, Follow-ups |

**Примечание:** текущая схема Supabase уже содержит properties (с parent\_id иерархией), programs (single + composite), program\_properties, program\_services, specialists, specialist\_outcomes, bookings, users, assessments, wbs\_question\_config. Это отправная точка для canonical model.

## Workstream 3 — Business Central Modules

Определить, какие домены живут в BC:

| Модуль BC | Что покрывает |
|---|---|
| Finance | Invoices, commissions, payouts, accounting |
| Partner Management | Contracts, legal entities, tax |
| Operations | Bookings, reservations, availability |
| CRM | Organizations, leads, opportunities |
| Reporting | Revenue, margins, partner performance |

## Workstream 4 — API Strategy

Определить API между слоями:

> **Website → Booking → Business Central → Partner Portal → AI → Analytics**

### Требования

- Versioning
- Authentication
- Webhooks
- Event architecture

## Workstream 5 — AI Platform

Спроектировать, где живёт AI. Не «AI everywhere», а AI-сервисы:

| AI-сервис | Функция |
|---|---|
| WBS interpretation | Интерпретация baseline-скора гостя |
| Recommendation engine | Матчинг гость → программа |
| Concierge | Сопровождение гостя pre/on/post-trip |
| Follow-up generation | Автоматические follow-up после поездки |
| Partner assistant | Помощник партнёру в дашборде |
| Sales copilot | Ассистент продаж |

**Синергия с Gigi (Cura):** Gigi отвечает за фронт коммуникации (WhatsApp/LINE/Instagram intake). Dmitry — за AI-мозг (профилирование, матчинг, рекомендации). Точка стыка — /api/intake. Одна интеграция закрывает фронт и бэк, работа не дублируется.

## Workstream 6 — BC Integration Roadmap

Разбить миграцию на фазы:

| Фаза | Содержание |
|---|---|
| Phase 1 | Read-only integrations |
| Phase 2 | Bookings |
| Phase 3 | Finance |
| Phase 4 | Partner Operations |
| Phase 5 | Analytics |
| Phase 6 | Full migration |

## Workstream 7 — Security

- Authentication
- Authorization
- Partner isolation
- Medical data (особая осторожность)
- GDPR
- PDPA (Thailand + Singapore)
- Audit logs

## Workstream 8 — Technical Debt Review

Ревью MVP. Определить:

- что должно остаться
- что должно быть переписано
- что становится микросервисом
- что принадлежит BC
- что остаётся в Supabase

## Workstream 9 — Investor Readiness

Подготовить архитектуру, пригодную для due diligence. Deliverables:

- Architecture overview
- Scalability assumptions
- Security overview
- Data governance
- AI architecture
- Roadmap

## Deliverables — итоговый список

- Enterprise Architecture Diagram
- Canonical Data Model
- BC Module Map
- API Specification
- Migration Roadmap
- Technical Debt Report
- Security Model
- Development Backlog — приоритизированный план внедрения

### Task Tracker — приоритеты Димы

Синхронизирован с общим DIT Task Tracker в Notion (teamspace dit HQ).

| Epic | Priority | Status |
|---|---|---|
| Enterprise Architecture | P0 | Not started |
| Canonical Data Model | P0 | Not started |
| Business Central Domain Map | P0 | Not started |
| API Specification | P1 | Not started |
| Authentication & Roles | P1 | Not started |
| Finance Module | P1 | Not started |
| Booking Integration | P1 | Not started |
| Partner Management | P1 | Not started |
| AI Services Architecture | P2 | Not started |
| Analytics Warehouse | P2 | Not started |
| Migration Plan | P2 | Not started |
| Technical Debt Audit | P2 | Not started |
| Production Infrastructure | P3 | Not started |
| Observability & Monitoring | P3 | Not started |
