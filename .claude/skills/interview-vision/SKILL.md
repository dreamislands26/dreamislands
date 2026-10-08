---
name: interview-vision
description: Interviews Mark (CEO) about where Dream Islands Travel is going and turns his answers into the raw interview record plus a new specs/brief.md, pushed on a branch for Dmitry. Use when Mark says "start the interview", "interview me", "начни интервью", "продолжим интервью", or asks to write the brief from his vision.
---

# interview-vision

Mark is the source of truth for `specs/brief.md`: what the business is for and where it
is going. Dmitry builds the technical design from that brief. This skill gets Mark's
vision out of his head, in his own words, and into the repo.

Two things are produced, both committed:

| File | What it is |
|---|---|
| `specs/research/interviews/YYYY-MM-DD-mark-vision.md` | The raw record: every question and Mark's answer, word for word |
| `specs/brief.md` | The structured brief, built only from that record |

For this skill, Mark is the owner. The line in `AGENTS.md` that names Dmitry as owner
applies to the technical design, not to this interview.

## Rules that keep the vision Mark's

1. **Do not read the existing documents first.** Until Part D, do not open
   `specs/brief.md`, `specs/tech-design.md`, `specs/roadmap.md` or anything in
   `specs/research/`. They hold Dmitry's reading of the business; reading them first
   would put his framing into your questions.
2. **Ask, never suggest.** No example answers, no options to pick from, no "would you
   say that…". If Mark asks what you think, say you will give your view after the
   interview, and ask the question again.
3. **One question at a time.** Wait for the answer. Then follow up until the answer is
   concrete: an example, a number, a date, who does it, what happens today instead.
4. **His words, not polished words.** If an answer reads like a pitch deck or pasted
   AI text, ask him to say it the way he would explain it to a new team member, and to
   give one real case.
5. **Write down what he said, not what he meant.** The record is verbatim, in the
   language he answered in. Fix obvious dictation errors only.
6. **Never fill a gap.** If he does not know or has not decided, that is the answer:
   record it and move on. It becomes an open question in the brief.
7. **Save after every answer.** Append to the record file as you go, so a closed laptop
   loses nothing.
8. **Leave out what does not belong in a shared repo:** passwords, bank details,
   salaries, equity splits, guest names and health details. Write `[omitted: <what>]`.

Speak with Mark in the language he uses (Russian by default). The record keeps his
language. The brief is written in English, like the rest of the repo.

## Before the first question

1. `git pull`, then `git checkout -b docs/brief-mark-vision` (if the branch exists,
   check it out and pull it).
2. If a record file already exists in `specs/research/interviews/`, read its status
   line and continue from the next unanswered question. Do not ask anything twice.
3. Otherwise create the record with this header:

   ```markdown
   # Mark's vision — interview record

   - Interviewee: Mark Semenov (CEO) · Interviewer: Claude
   - Sessions: YYYY-MM-DD
   - Status: Part A, question A1 next
   ```

4. Tell Mark what will happen: about 40 questions in three parts, around 90 minutes in total (Parts A and B in one sitting, Part C can be a second one), he can
   stop at any point and continue later, and nothing is published until he approves.

Each entry in the record:

```markdown
### A3 · Why the guest comes back
**Q:** <the question as asked>
**A:** <his answer, verbatim>
**Follow-up:** <question> — <answer>
```

Update the status line whenever you stop. At every pause: commit the record
(`docs: Mark vision interview, raw record (part A)`) and `git push -u origin
docs/brief-mark-vision`.

## Part A — Where we are going

Ask in this order. Wording may be adapted to the conversation; the intent may not.

- **A1.** Через три года Dream Islands работает так, как ты задумал. Опиши один обычный день: что происходит у гостя, у партнёра и у команды?
- **A2.** Для кого мы строим это в первую очередь? Опиши одного конкретного гостя. И кого мы сознательно не обслуживаем?
- **A3.** Зачем гость возвращается к нам после первой поездки? Что он теряет, если уходит?
- **A4.** Что получает партнёр, чего у него нет без нас? За что он готов платить или давать нам условия?
- **A5.** На чём мы зарабатываем сегодня и на чём через три года? Кто, кому и в какой момент платит?
- **A6.** Откуда приходят продажи: свой сайт, агенты, white-label, API, что-то ещё? Расставь по важности и скажи, что из этого появляется когда.
- **A7.** Что должно быть только нашим, чего нельзя купить или скопировать? А что мы спокойно берём готовым?
- **A8.** Назови цифры, к которым мы идём, с датами: гости, партнёры, страны, выручка, команда.
- **A9.** Что обязано быть сделано через 6, 12 и 24 месяца? Что может подождать? Что ты вычеркнешь, если времени и денег вдвое меньше?
- **A10.** Чего не должно случиться ни при каких условиях? Где красные линии: медицина, данные гостей, качество, репутация?
- **A11.** Что люди ошибочно ждут от Dream Islands, а мы этим заниматься не будем?
- **A12.** По каким цифрам через год ты поймёшь, что мы на верном пути? А по каким — что нет?

## Part B — How it should work, end to end

For each stage ask the same thing: «Как это должно работать, когда сделано правильно?»
Then follow up on: who does what, what happens without a person, what the guest or
partner sees, and what is different from today.

- **B1.** Партнёр узнаёт о нас и подаёт заявку. Что происходит дальше, до момента, когда он «наш»?
- **B2.** Проверка и сертификация партнёра, договор и коммерческие условия. Кто решает и на каком основании?
- **B3.** Программы, цены и контент партнёра. Кто их создаёт и обновляет, кто отвечает за качество?
- **B4.** Доступность: как мы узнаём, что место на нужные даты есть, и что происходит, если его нет?
- **B5.** Маркетинг: как гость о нас узнаёт? Как мы понимаем, какой канал привёл гостя и окупился?
- **B6.** Гость проходит оценку и получает подбор программы. Что он видит и что из этого делает подбор «нашим»?
- **B7.** Продажа: от первого контакта до решения гостя. Кто ведёт гостя, где это видно, что происходит, если гость замолчал?
- **B8.** Бронирование и оплата: депозит, остаток, возвраты, валюты.
- **B9.** Перед поездкой: что должно быть подготовлено и согласовано с партнёром, и кем?
- **B10.** Во время поездки: что происходит с гостем каждый день, какие check-ins, кто реагирует, если что-то идёт не так?
- **B11.** После поездки: результаты, 30/60/90 дней. Что гость получает от нас и что мы узнаём о нём?
- **B12.** Следующая поездка: что и когда приводит гостя обратно?
- **B13.** Деньги партнёру: комиссия, выплаты, сверка, отмены.
- **B14.** Учёт и отчёты: что ты и инвесторы должны видеть каждый месяц?
- **B15.** Что партнёр видит у себя в кабинете и какие решения он по этому принимает?
- **B16.** Команда: продажи, поддержка, консьерж. Что делает человек, что делает AI, чего AI делать нельзя?
- **B17.** О чём я не спросил? Какие части бизнеса мы не обсудили, а без них он не работает?

## Part C — Questions the architect needs answered

Ask these only after Parts A and B are finished. Say that they come from Dmitry. If
Mark already answered one above, point to that entry and skip it.

- **C1.** Где граница: что ведём в Business Central, а что остаётся нашим собственным слоем? Что из этого решено, а что гипотеза?
- **C2.** Остаток после депозита: когда гость его платит, как, и что происходит при неоплате?
- **C3.** Выплаты партнёрам: по какому расписанию, каким способом, как сверяем, что при отмене и возврате?
- **C4.** Валюты: в какой ведём учёт компании, в какой платит гость, в какой получает партнёр?
- **C5.** Сертификация партнёра: какие критерии, кто решает, как часто пересматриваем?
- **C6.** Доступность и цены: откуда они берутся у каждого типа партнёра? Нужна ли проверка наличия до оплаты?
- **C7.** Cura и AI-агенты: что остаётся на Cura, что строим сами, что из этого решено?
- **C8.** Медицинские и wellness-данные гостя: кто их видит, что получает партнёр, на что нужно согласие гостя?
- **C9.** Какие решения ждут регистрации компании в Сингапуре или раунда?
- **C10.** Что из того, что сегодня делается руками, должно быть автоматизировано первым?

## Part D — Write the brief

1. Read the whole record. Then, and only now, read the current `specs/brief.md`.
2. Move the current brief to `specs/research/brief-2026-08-dmitry-synthesis.md` with
   `git mv`. It stays as background, not as the brief.
3. Write the new `specs/brief.md` with these sections, in this order:

   | Section | Holds |
   |---|---|
   | Where we are going | 3–5 sentences: the destination and the horizon (A1, A8, A9) |
   | Problem | What hurts today, for whom |
   | Who it is for | The guest, the partner, and who we do not serve (A2, A4, A11) |
   | What it must do | Numbered requirements `R1…`, one line each, in business language |
   | Non-goals | A11 and anything he ruled out |
   | Constraints | Facts imposed from outside: legal, money, dates, red lines (A10) |
   | Success criteria | Numbers and dates only (A8, A12) |
   | Open questions | Everything he did not know or has not decided |
   | Revisions | `- YYYY-MM-DD: rewritten from Mark's interview.` |

4. Writing rules:
   - Every line ends with the record entries it comes from, for example `(A5, B4)`.
     A line with no source does not go in.
   - No technology choices unless Mark stated one as a constraint.
   - Keep it under 150 lines. Detail stays in the record.
   - Where Mark contradicted himself, do not pick: put both statements under Open questions.
5. Add a last section to the record, `## Differences from the earlier brief`: where
   Mark's answers differ from `brief-2026-08-dmitry-synthesis.md`, as a short list.
   Do not edit `specs/tech-design.md` or `specs/roadmap.md`; that is Dmitry's work.
6. Add one more section to the record, `## Coverage of the process inventory`: read
   only the Process Inventory table in `specs/tech-design.md` and, for each process
   `P-01…`, list the record entries that speak to it, or write `not covered`. Add a
   second list: things Mark described that no process in the table covers.

## Part E — Mark approves, then push

1. Read the brief back to Mark in his language, section by section. Apply his
   corrections to the brief, and add each correction to the record as a new entry
   (`### E1 · Correction`), so the record stays the full source.
2. When he says it is right: commit (`docs: brief rewritten from Mark's vision interview`)
   and `git push -u origin docs/brief-mark-vision`.
3. Open a pull request to `main` titled "Brief: Mark's vision". If you cannot, give
   Mark this link to open it himself:
   `https://github.com/dreamislands26/dreamislands/compare/docs/brief-mark-vision?expand=1`
4. If the push fails, do not retry with other credentials. Tell Mark to send Dmitry the
   two files named at the top of this skill.

## Never

- Never push to `main`.
- Never change anything outside `specs/brief.md`, `specs/research/brief-2026-08-dmitry-synthesis.md`
  and `specs/research/interviews/`.
- Never write the brief before Parts A–C are finished, unless Mark asks to stop early;
  then write it from what exists and list the unasked questions under Open questions.
