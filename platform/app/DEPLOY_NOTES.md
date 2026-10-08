# Выкладка 21.09.2026: UI-правки по аудиту юзабилити

Источник: GitHub `olegoonline/dit-platform`, ветка `fix/ui-usability-audit`, коммит `410e8d7`.
Предыдущая версия (ветка `feature/guest-profile-admin`, коммит `6ceaf0d`) лежит в
`/opt/dit-platform-prev-6ceaf0d`. Откат: поменять папки местами и `pm2 restart dit`.

Перед выкладкой сервер сверен с `6ceaf0d`: файлы совпадали побайтно, прямых правок не было.
Зависимости (package.json / lock) не менялись, node_modules скопированы из прежней версии.
База данных, её схема и фотографии не менялись.

## Коммиты

- `4d7320b` UI fixes from the 21.09 usability audit (public site)
- `5cf44c0` Footer: Partner login link to the panel sign-in
- `ecc972f` Revert /start answer-option and progress-bar restyle
- `410e8d7` Revert promise-flower reposition and nav CTA rename

## Что изменилось на сайте

- Шрифты: сайт рендерился в Times New Roman (пустой `--font-body`). Переменные next/font
  теперь на `<html>` (src/app/layout.tsx). Accent — Optima (fallback Belleza), base — Aeroport
  (fallback DM Sans), mono — Roboto Mono. Все h1/h2 набраны accent-шрифтом.
- Карточки программ: плашки треков читаются, у пиктограмм целей подписи.
- Карусели: стрелки и затухание справа (новый компонент `_components/Rail.tsx`).
- «Pick a direction»: пять треков в ряд на десктопе, иконка у Sport & Chill.
- Логотипы партнёров на светлых плашках; кнопка Tanya Samui читается.
- Меню Destinations открывается по клику и не закрывается на пути к меню.
- Карточка Boost Energy того же вида, что остальные.
- Число программ на главной одно (было 54 и 62), вопросов везде 23.
- Ссылки: WhatsApp China specialist и Telegram с номером; Key Outcomes → `#outcomes`;
  флаги в футере → `/destinations/<страна>`; новая ссылка Partner login →
  `NEXT_PUBLIC_PANEL_SITE_URL/login`.
- Телефон: шапка в одну строку (знак-логотип, бургер справа), компактные карточки целей,
  линия маршрута не пересекает текст, порядок блоков как на десктопе.
- Ширина: на планшете колонка во всю ширину; кнопка Tanya Samui, статистика и футер выровнены
  по колонке; карточка Tanya Samui на /about не обрезается на телефоне.

Откачено по решению Олега: рестайл анкеты /start, перенос цветка в блоке Promise,
переименование кнопки Take Assessment.

Отчёт в Notion: «Отчёт: UI-правки по аудиту юзабилити — 21.09.2026» (Claude Communication / Олег).
