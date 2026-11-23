# B13 · Partner money flow (provided by Mark 2026-10-13, as is)

Source: Mark Semenov, attached during the vision interview, entry B13. Stored verbatim.

B13. Partner Money — Business Flow
1. Partner Commercial Setup
До первой продажи для каждого партнёра фиксируются machine-readable Commercial Rules:
Rate / Net Cost | Commission | Commissionable Components | Payment Flow | Partner Payment Rule | Cancellation / Refund Rule | Direct-Payment Rule | Attribution Rule | Currency / Fees
Каждый компонент продукта классифицируется отдельно:
Program | Accommodation | Transfer | Treatment | Practitioner | Upgrade | Onsite Extra | Retail | Other
Для каждого:
Gross Amount → Commissionable Y/N → Commission Rate → DI Commission → Partner Net
No Commercial Rules → No Bookable Inventory.
2. B2B Distribution / OTA Best Practices
По модели крупных OTA типа Agoda партнёр должен управлять коммерческим inventory через единый partner layer:
Property → Programs / Rate Plans → Availability → Restrictions → Pricing → Promotions → Booking → Modification / Cancellation → Settlement
Обязательные элементы:
- Rate plans — разные тарифы и cancellation/payment conditions.
- Availability — sellable inventory и blackout dates.
- Restrictions — minimum stay/program duration, booking window, occupancy/capacity.
- Promotions — скидки и special offers без изменения базового договора.
- Booking confirmation — единый Booking ID и snapshot условий в момент бронирования.
- Modification flow — изменение дат/program/room без создания неучтённых договорённостей в WhatsApp.
- Cancellation flow — автоматическое применение policy конкретного rate plan.
- Partner extranet/API — партнёр сам поддерживает rates, availability и booking status; DI управляет standardization/quality.
- Settlement statement — booking-level breakdown partner net, DI commission, adjustments, refunds и payout status.
- Audit trail — кто и когда изменил rate, availability, policy или booking.
- Overbooking / partner cancellation handling — заранее определённая ответственность партнёра и escalation flow.
- Parity / channel rules — если применимо, заранее определить правила direct pricing и обхода DI.
3. Guest Payment
Каждый платёж связывается с:
Guest → Booking ID → Partner → Program → Commercial Rules Snapshot
Финансовый ledger:
Total Booking Value → Paid to DI → Paid Direct to Partner → Partner Cost → Commissionable Amount → DI Commission → Fees/Taxes → Refund Reserve → Partner Payable → Partner Paid → Balance
Смешанный payment flow допустим только если direct payments также отражаются в booking ledger.
4. Booking Terms Snapshot
В момент confirmation система фиксирует:
Rate | Components | Commission | Payment Schedule | Cancellation Policy | Partner Payment Rule | Attribution Rule
Последующее изменение master terms партнёром не изменяет существующий booking.
5. Partner Payable
Для каждого партнёра задаётся:
Partner Payment Rule = Event Trigger + Due Date + Amount/%
Примеры:
50% on Confirmation / 50% 7 Days Before Check-in
или
100% when Free-Cancellation Window Closes
Lifecycle:
Guest Paid → Reserved → Trigger Reached → Partner Payable → Payment Due → Paid
Даже до возникновения unconditional Partner Payable средства, необходимые для исполнения booking/refund, не становятся свободным working capital DI.
6. Cancellation / Refund
При cancellation система использует snapshot конкретного booking:
Cancellation Event → Guest Refund → Partner Entitlement → DI Fee/Commission → Transaction Fees → Settlement Adjustment
Если partner ещё не получил деньги → корректируется reserve/payable.
Если получил:
Partner Refund → Credit Note → Offset Against Future Settlement
Отдельные правила:
Guest Cancellation | Partner Cancellation | No-show | Date Change | Partial Cancellation | DI Goodwill Refund
Для каждого определяется risk owner.
7. Extras & Direct Payments
Любой extra добавляется к существующему Booking ID:
Extra → Component Type → Gross → Commissionable Y/N → Commission → Partner Net
Если guest платит partner directly:
Direct Payment → Booking Ledger → Commission Rule → DI Receivable
Таким образом direct payment не выводит transaction из финансовой модели DI.
8. DI Attribution
Система хранит:
Attribution Start → Attribution Scope → Attribution Expiry
Правило должно определить attribution для:
Original Booking | Extension | Repeat Booking | New Program | Direct Booking with Same Partner | Partner's Other Channel
Если guest документированно существовал в CRM партнёра до DI introduction, DI attribution не возникает.
9. Partner Reconciliation
Partner statement:
Booking ID | Guest/Stay | Gross | Direct Payments | Extras | Commission | Refunds/Adjustments | Partner Payable | Paid | Outstanding
Сверка:
Booking-level ongoing reconciliation → Monthly Partner Statement → Final Settlement
Расхождение:
Exception → Owner → Evidence → Approval → Adjustment → Audit Trail
10. Financial Close
Booking получает Financially Closed, когда:
Guest Payments + Direct Payments = Partner Settlement + DI Margin + Fees/Taxes + Refunds/Adjustments
и отсутствует необъяснённый balance.
11. Treasury Control
Partner Payable и необходимые booking/refund reserves не являются операционным cash DI.
Dashboard:
Total Partner Payables | Booking/Refund Reserves | Reserved Cash | Payments Due | Shortfall
Control:
Reserved Cash must cover protected booking obligations.

Shortfall > 0 → Financial Incident
12. Tanya Control Design
Чтобы Tanya-сценарий не повторился, система не допускает:
Undefined Commission Base → Manual Direct Payments → Untracked Extras → Different Versions of Rates → Unclear Partner Balance → Post-factum Reconciliation
Вместо этого:
Commercial Rules → Booking Snapshot → Ledger → Settlement → Reconciliation → Financial Close