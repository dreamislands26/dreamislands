# B17 · What was not discussed (provided by Mark 2026-10-13, as is)

Source: Mark Semenov, attached during the vision interview, entry B17. Stored verbatim (the interviewer's question echoed at the top of the attachment is removed).

B17. Что ещё не обсудили
После B1–B16 основная механика бизнеса уже покрыта. Я вижу 7 оставшихся систем, без которых модель либо не масштабируется, либо начинает ломаться при росте.
1. Supply Liquidity — когда destination реально «работает»
Мы обсудили onboarding properties и создание standardized products, но не определили минимальную плотность supply.
Для каждого ICP × Cohort × Destination нужно понимать:
# Relevant Properties | # Bookable Programs | Availability | Price Coverage | Conversion | Booking Volume
Нужен критерий:
Когда мы считаем destination/cohort достаточно ликвидным, чтобы активно лить туда demand?

Иначе marketing приводит guest, а подходящего bookable inventory нет.
2. Demand Acquisition Economics
Мы много говорили о conversion и LTV, но не зафиксировали экономику привлечения.
Нужна цепочка:
Channel → Lead/Profile → Qualified Intent → Booking → GMV → DI Revenue → Contribution Margin → Repeat

По каждому ICP:
CAC | Lead→Booking CVR | Revenue per Booking | Gross/Contribution Margin | Repeat | LTV | CAC Payback
Без этого можно увеличивать GMV и одновременно ухудшать бизнес.
3. Marketplace Liquidity / Matching
Это центральная механика двухсторонней платформы, которую мы пока обсуждали кусками.
Нужно измерять:
Guest Intent → Qualified Matches → Available Matches → Booking

Например:
% searches with ≥3 relevant programs
Match → Booking CVR
Time to Match
No-match Rate
Lost Booking Reason
Это соединяет B2C и B2B. Если matching не работает, проблема может быть не в sales, а в supply coverage, price, availability или product structure.
4. Quality Standard
Мы определили стандартизацию продукта и основания для suspension, но не сам Dream Islands Wellness Standard.
Нужно формально определить:
Что property/program должен выполнить, чтобы называться DI Standardized / Verified?

Например:
Program Structure | Practitioner Verification | Safety | Guest Communication | Measurement | Service Quality | Data Compliance | Commercial Reliability
И дальше:
Verified → Monitored → Warning → Improvement Plan → Suspended

Иначе слово standardized останется data-formatting, а должно стать частью доверия к бренду и B2B product.
5. Unit Economics на уровне Booking
B13 определил движение денег, но отдельно нужен economics layer.
Для каждого booking:
GMV → DI Revenue → Payment Costs → Sales/CS Cost → Acquisition Cost → Refund/Exception Cost → Contribution Margin

А затем:
Contribution Margin per Booking
Contribution Margin per Guest
Contribution Margin per ICP/Cohort
Contribution Margin per Property
Contribution Margin after Repeat
Это особенно важно для concierge/AI thesis: нужно доказать не только рост bookings, но что service cost per booking снижается при росте.
6. Experimentation / Decision System
Мы определили, какие данные собираем, но не определили, как компания принимает решения на их основе.
Нужен простой operating cadence:
Hypothesis → Experiment → Metric → Decision → Product/Commercial Change

Например:
7-day programs для ICP X должны давать выше conversion/repeat, чем 5-day.

Через месяц:
Scale / Iterate / Kill

Это касается acquisition, cohorts, programs, pricing, partner product и AI.
Иначе появится много данных и dashboards, но не learning engine.
7. Failure / Recovery
Мы подробно разобрали normal flow, но почти не разобрали, что происходит, когда journey ломается.
Нужны workflows:
Property overbooking
Partner cancels
Practitioner unavailable
Guest arrives and program differs from promise
Serious complaint
Refund dispute
Flight disruption / late arrival
Property becomes unavailable mid-journey
Для каждого:
Detect → Owner → Guest Communication → Alternative → Financial Responsibility → Resolution → Incident Record

Для premium wellness travel recovery experience — часть продукта, а не только operations.
Что из этого критично закрыть сейчас
Я бы не создавал ещё семь больших документов. До Seed / build достаточно закрыть четыре вещи:
Приоритет	Решение
1	Dream Islands Wellness Standard — что именно означает standardized / verified
2	Marketplace Liquidity — когда ICP × Cohort × Destination имеет достаточно supply для масштабирования demand
3	Unit Economics — contribution margin и CAC/LTV, а не только GMV/revenue
4	Failure & Recovery — кто и что делает, когда journey не идёт по плану


Остальные — acquisition economics, matching analytics и experimentation — естественно ложатся поверх этих систем.
Вся часть B тогда замыкается в один operating loop
Acquire Supply → Standardize Inventory → Build Products → Distribute → Acquire Guest → Match → Book → Deliver → Measure Outcome → Retain → Repeat → Pay Partner → Learn → Improve

И вокруг него четыре control systems:
Quality | Money | Data/Consent | Exceptions