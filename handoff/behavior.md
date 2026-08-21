# Куток — поведінкова специфікація

> Handoff-специфікація станом на 21 серпня 2026 року. Описує підтверджену поведінку
> статичного прототипу, але не перетворює демонстраційні HTML-переходи на вигаданий backend-
> контракт. Джерела: [flows.md](../flows.md), [замовлення екранів і станів](../wireframes/_screens.md),
> [активні wireframes](../wireframes/index.html), [інвентар microcopy](../wireframes/microcopy.md)
> та [onboarding gaps](./onboarding-gaps.md).

## 1. Як читати специфікацію

У документі діють три мітки:

- **Contract** — правило прямо зафіксоване у flow і підтримане екраном або станом.
- **Represented** — поведінка показана wireframe-переходом, але не має повного продуктового
  контракту. Її можна відтворити у прототипі, але не можна мовчки переносити в доменну логіку.
- **Documented gap/debt** — джерела суперечать одне одному або не дають відповіді. Реалізація
  не повинна сама обирати продуктове рішення.

Порядок використання джерел:

1. `flows.md` задає намір, gates і кінцеві результати.
2. `wireframes/_screens.md` задає перелік екранних станів і пояснює, де стан свідомо відсутній.
3. Активний HTML показує конкретні контролі та клікабельний маршрут між станами.
4. `wireframes/microcopy.md` є інвентарем, а не новим джерелом поведінки; тексти беруться з
   відповідної секції, а позначені там неузгодженості не нормалізуються навмання.
5. Якщо рівні розходяться, діє debt у розділі 11, а не «останній змінений файл».

Рядки `WIREFRAME-NAV` у [зведенні microcopy](../wireframes/microcopy.md#wireframe-nav--рядки-заглушки-для-навігації-прототипом-не-продуктовий-текст)
є перемикачами демонстраційних станів і не входять у продукт.

## 2. Загальні поведінкові інваріанти

### 2.1 Навігація та доступ

- **Contract:** після входу основна навігація — Пошук, Заявки, Чати, Профіль. Заявки й Чати
  мають in-app лічильники; push-сповіщення поза MVP. Джерело: RJ3 у
  [flows.md](../flows.md#rj3--почати-розмову-тільки-якщо-інтерес-взаємний) та спільні елементи у
  [microcopy](../wireframes/microcopy.md#0-спільні-елементи-повторюються-майже-на-кожному-екрані).
- **Contract:** каталог можна переглядати без верифікації; перший контакт gated перевіркою.
- **Contract:** чат доступний лише після взаємного інтересу.
- **Represented:** для шукача вкладка Заявки веде до `applications.html`, для господаря — до
  `candidates.html`; вкладка Профіль веде до відповідного `my-profile-*`. Це видно у
  [активних 20 екранах](../wireframes/_screens.md#активні-20).
- **Documented gap/debt:** поведінка табів для людини з обома ролями не визначена; див. D-02.

Компонентні опори: shell у [ui/shell.html](../ui/shell.html), навігаційні компоненти в
[UI-інвентарі](../ui/inventory.md#навігація), пошук через `.search-form` / `.search-popover`.

### 2.2 Асинхронні стани

- **Contract:** read-екрани, для яких замовлено loading, показують форму майбутнього контенту
  через skeleton, не порожній стан. Це каталог, заявки, профілі, кімната, кандидати, оголошення,
  діалоги та чат; повна матриця — у [кроці 07](../wireframes/_screens.md#зведена-таблиця--екран--стан)
  і [кроці 08](../wireframes/_screens.md#зведена-таблиця--екран--стан-крок-08).
- **Contract:** mutation-loading блокує повторну основну дію. Активні `*-loading.html`
  відключають submit/поля для входу, збереження профілю, публікації та верифікації.
- **Contract:** upload-error профілю або кімнати зберігає вже введені поля; retry повторює
  upload, а основна submit-дія лишається заблокованою до наявності фото.
- **Represented:** технічні помилки показуються компонентом `.banner`; порожні результати —
  `.state-block`; завантаження — `.sk`/skeleton. Компоненти описані у
  [UI-інвентарі](../ui/inventory.md#зворотний-звязок).
- **Documented gap/debt:** idempotency, timeout, offline queue і поведінка повторного submit
  після невідомого результату не визначені; див. D-10.

### 2.3 Empty не дорівнює error

- **Contract:** empty означає успішне отримання нульового набору або відсутність історії;
  error означає, що результат невідомий.
- **Contract:** каталог має два різні empty: завузький фільтр і market cold-start. Перший
  змінює/скидає фільтри, другий пропонує сусідні райони або майбутнє повідомлення.
- **Contract:** відсутність відгуків не блокує оцінку профілю; це очікуваний cold-start.
- Тексти й CTA не дублюються тут: використовувати відповідні секції
  [каталогу](../wireframes/microcopy.md#listingshtml--listings-emptyhtml--listings-empty-coldstarthtml--listings-errorhtml--listings-loadinghtml--listings-desktophtml),
  [заявок](../wireframes/microcopy.md#applicationshtml--applications-emptyhtml--applications-loadinghtml),
  [кандидатів](../wireframes/microcopy.md#candidateshtml---empty---loading),
  [діалогів і чату](../wireframes/microcopy.md#dialogshtml--dialogs-emptyhtml--dialogs-loadinghtml).

## 3. Flow A — existing-user login і перший профіль

Джерела: G1 у [flows.md](../flows.md#g1--вхід-existing-user-повернення--новий-пристрій),
екрани 8–9 у [кроці 08](../wireframes/_screens.md#8-вхід-existing-user), активні
[`login*`](../wireframes/login.html), [`role-select`](../wireframes/role-select.html) і
`profile-create-*`; copy — [microcopy §1](../wireframes/microcopy.md#1-спільне--обидві-ролі).

| Крок | Умова / дія | Loading | Результат і перехід |
|---|---|---|---|
| Повернення | Людина подає телефон і SMS-код на `login.html`. | `login-loading.html`; поля й submit недоступні. | Відомий номер + вірний код → Пошук. Новий номер → створення профілю. |
| Помилка входу | Код невірний або SMS не дійшла. | — | `login-error.html`: повторити вхід або resend; без доступу до номера → recovery/support. |
| Перша реєстрація | Із login обрано створення профілю. | — | `role-select.html` розводить на seeker/host profile-create. |
| Профіль шукача | Заповнити profile-create-seeker і зберегти. | `profile-create-seeker-loading.html`. | Успіх → каталог. Upload error → однойменний error-state, дані збережені, фото retry. |
| Профіль господаря | Заповнити profile-create-host і зберегти. | `profile-create-host-loading.html`. | Успіх → створення оголошення. Upload error → error-state, дані збережені, фото retry. |

Правила та edge cases:

- **Contract:** G1 повинен розрізняти existing і new number, щоб не створити дублікат профілю.
- **Contract:** фото профілю є обов'язковим для завершення create-flow; error-state блокує
  головну дію, доки фото не додано.
- **Represented:** роль вибирається переходом через `.role-option`; кабінети дають CTA додати
  другу роль через протилежний `profile-create-*`.
- **Documented gap/debt:** точний порядок role/profile/consent/verification і модель двох ролей
  не визначені (D-01, D-02). `login-loading.html` містить лише prototype state links для
  розгалуження, не продуктову автоматику.

## 4. Flow B — каталог, фільтр і оцінка довіри

Джерела: MAIN, RJ1 і RJ2 у [flows.md](../flows.md#main-job--безпечно-знайти-з-ким-і-де-жити),
екрани 2–4 у [кроці 07](../wireframes/_screens.md#2-стрічка--каталог-кімнати--люди-з-фільтром),
активні `listings*`, `profile*`, `room*`; copy — [microcopy §2](../wireframes/microcopy.md#2-шукач--аня)
і [§4](../wireframes/microcopy.md#4-взаємодія--обидві-ролі).

### 4.1 Каталог

1. **Contract:** початкове завантаження/оновлення показує `listings-loading.html`.
2. **Contract:** результат містить картки кімнат і людей; тип, район, price ceiling і стать є
   доступними фільтрами. Застосування фільтра повторно завантажує той самий екран.
3. **Contract:** success → вибір картки → `room.html` або `profile.html`.
4. **Contract:** zero filtered result → `listings-empty.html`; зміна фільтрів зберігає
   контекст, reset повертає весь каталог.
5. **Contract:** zero market result → `listings-empty-coldstart.html`; це не виправляється
   простим reset.
6. **Represented:** network/read failure → `listings-error.html` → retry того самого запиту.
   Цей error додано на рівні `_screens.md`, бо окремого вузла в `flows.md` немає.
7. **Represented:** вузький і широкий layout використовують ті самі фільтри; на вузькому
   фільтр живе у `.sheet`, на широкому — у `.filters-form`. Вони мають бути двома
   представленнями одного filter state, а не двома незалежними наборами значень.

### 4.2 Профіль або кімната до контакту

- **Contract:** деталь показує розшифрований verification badge, а не німе «перевірено».
- **Contract:** неповний профіль і відсутність відгуків відображаються всередині деталі, а не
  як технічна помилка. Відсутність відгуків сама по собі не забороняє контакт.
- **Contract:** room detail містить зв'язок із профілем господаря; chat header — із профілем
  співрозмовника.
- **Contract:** back повертає у каталог; report/block доступний з person/room/chat surface.
- **Represented:** photo відкриває архівний photo viewer; див. межу `_archive` у D-03.

## 5. Flow C — interest gate і верифікація

Джерела: MAIN/RJ3 і G2 у [flows.md](../flows.md#g2--верифікація-телефон--селфі-деталізований-під-flow),
екрани 9–13 у [кроці 08](../wireframes/_screens.md#9-згода-на-дані--біометрію), активний кластер
`consent.html`, `verify-phone*`, `verify-code*`, `verify-selfie*`, `verify*`; copy — секції
[consent](../wireframes/microcopy.md#consenthtml), [phone](../wireframes/microcopy.md#verify-phonehtml--verify-phone-errorhtml--verify-phone-loadinghtml),
[code](../wireframes/microcopy.md#verify-codehtml--verify-code-errorhtml--verify-code-loadinghtml),
[selfie](../wireframes/microcopy.md#verify-selfiehtml--verify-selfie-errorhtml--verify-loadinghtml)
і [result](../wireframes/microcopy.md#verifyhtml-готово--verify-errorhtml-не-збіглось--verify-pendinghtml-ручна-перевірка).

| Крок | Precondition | Success | Error / edge |
|---|---|---|---|
| Gate | Натиснуто interest CTA. | Уже verified → відправити interest. | Не verified → consent. |
| Consent | Позначені обидві окремі згоди. | Перейти до phone. | Без будь-якої згоди продовжити не можна; окремого invalid-state немає. |
| Phone | Подано номер. | Під час SMS send — phone-loading; потім code. | SMS не дійшла → phone-error → resend. Формат номера не визначений. |
| Code | Подано SMS-код. | code-loading → selfie. | Невірний/не отриманий → code-error → повторити або resend. |
| Selfie | Є згода й camera permission. | Захоплення → `verify-loading.html` для match + liveness. | Нема дозволу → інструкція ОС; після зміни відкрити крок знову. |
| Result | Match і liveness успішні. | `verify.html`: badge `phone ✓ / photo ✓`; початкову interest-дію розблоковано. | Mismatch/liveness fail → `verify-error.html`; retry selfie. Після N невдач → pending/support. |
| Pending | Автоматична перевірка не завершена. | Стрічка доступна під час ручної перевірки. | Інші дозволені дії й завершення pending не визначені. |

Додаткові правила:

- **Contract:** телефон не показується публічно; довіра передається статусом перевірки.
- **Contract:** нове фото профілю скидає `photo ✓` і запускає повторну звірку; джерело —
  [microcopy my-profile edit](../wireframes/microcopy.md#my-profile-seekerhtml---loading---edit) і G2.
- **Contract:** після успішної верифікації користувач має повернутися до перерваної interest-дії,
  а не просто у довільну деталь.
- **Documented gap/debt:** HTML hard-code веде success до `room.html`; N, expiry SMS,
  resend limits, provider, retention і pending permissions не визначені (D-04, D-05).

## 6. Flow D — заявка, взаємність, кандидати й чат

Джерела: RJ3 та E у [flows.md](../flows.md#rj3--почати-розмову-тільки-якщо-інтерес-взаємний),
екрани 6–7 і 20–21 у [`_screens.md`](../wireframes/_screens.md#6-мої-заявки-надіслані--очікують),
`applications*`, `candidates*`, `dialogs*`, `chat*`; copy — відповідні секції
[applications](../wireframes/microcopy.md#applicationshtml--applications-emptyhtml--applications-loadinghtml),
[candidates](../wireframes/microcopy.md#candidateshtml---empty---loading),
[dialogs](../wireframes/microcopy.md#dialogshtml--dialogs-emptyhtml--dialogs-loadinghtml) і
[chat](../wireframes/microcopy.md#chathtml--chat-emptyhtml--chat-loadinghtml).

### 6.1 Вихідна заявка

1. **Contract:** interest submit має mutation-loading на detail (`profile-loading.html` або
   еквівалент стану room), щоб не відправити дубль.
2. **Contract:** network failure лишає detail доступною для retry або повернення у каталог.
3. **Contract:** success створює рядок у «Мої заявки» зі статусом waiting; detail показує
   неактивну sent-state замість повторного CTA.
4. **Contract:** waiting application можна відкликати. Відхилення видиме; тиша не переводить
   заявку у відхилення — вона лишається активною.
5. **Contract:** mutual interest змінює статус і створює доступний chat.
6. **Empty:** якщо заявок ще немає, CTA повертає у Пошук.

### 6.2 Вхідна заявка господаря

1. **Loading:** `candidates-loading.html` під час отримання списку.
2. **Empty:** `candidates-empty.html`; оголошення лишається active, CTA веде до редагування
   оголошення, а не до вигаданих кандидатів.
3. **Success:** рядок кандидата відкриває person profile для оцінки trust signals.
4. **Accept — Contract:** створює взаємність і відкриває chat.
5. **Decline — Contract на рівні flow:** повертає до списку кандидатів без chat.
6. **Safety edge:** із профілю кандидата можна перейти до report/block.

### 6.3 Діалоги та чат

- **Contract:** `dialogs.html` містить тільки розмови після взаємного інтересу.
- **Loading/empty/success:** `dialogs-loading.html` → `dialogs-empty.html` або список `.row`;
  рядок відкриває `chat.html`.
- **Contract:** новий matched chat може не мати повідомлень; `chat-empty.html` зберігає active
  composer і пропонує почати розмову.
- **Success:** історія повідомлень + `.composer`; peer header відкриває профіль, safety action —
  report/block. Пораду безпеки брати з microcopy chat, не дублювати іншою редакцією.
- **Documented gap/debt:** немає error/send-failed/offline стану повідомлення, правил empty
  submit, доставки/read status, вкладень чи закриття chat (D-07).
- **Documented gap/debt:** RJ3 веде rejected/silent у «Список діалогів», але IA й dialogs
  microcopy допускають там лише mutual conversations; rejected/silent мають лишатися у
  applications, доки команда не вирішить конфлікт (D-06).

## 7. Flow E — supply: кімната, оголошення, lifecycle

Джерела: flow E у [flows.md](../flows.md#e-бік-господаря--підселити-не-впустивши-не-ту-людину),
екрани 22–23 у [`_screens.md`](../wireframes/_screens.md#22-створенняредагування-оголошення),
активні `room-create*`, `my-listings*`, `candidates*`; copy —
[room-create](../wireframes/microcopy.md#room-createhtml---error---loading) і
[my-listings](../wireframes/microcopy.md#my-listingshtml---empty---loading).

| Стан | Поведінка |
|---|---|
| Немає оголошень | `my-listings-empty.html` → create room. |
| Create/edit | Форма містить фото, опис, ціну, район, правила й дату заселення; preview є представленням поточних значень, не окремим збереженим об'єктом. |
| Publishing | `room-create-loading.html`; поля й submit заблоковані. |
| Upload error | `room-create-error.html`; введені значення збережені, publish заблоковано до успішного фото retry. |
| Success | Оголошення з'являється в «Мої оголошення» й active catalog; далі можливі кандидати. |
| List loading | `my-listings-loading.html`. |
| Lifecycle | Хаб представляє active та occupied і дії edit/pause/mark-free; sitemap також називає paused/archive. |

Правила та edge cases:

- **Contract:** опублікована кімната має щонайменше фото, ціну й район; без фото publish
  заблоковано. Інші required-поля не зафіксовані.
- **Contract:** inactive/occupied listing не повинен залишатися «мертвим» active supply у
  каталозі; точна видимість кожного статусу не визначена.
- **Documented gap/debt:** немає confirmation, optimistic state, error або rollback для pause,
  mark-free, accept/decline і edit existing listing; повний lifecycle transition table відсутній
  (D-08).

## 8. Flow F — мій профіль і повторна верифікація

Джерела: екрани 14–17 у [`_screens.md`](../wireframes/_screens.md#14-мій-профіль),
`my-profile-seeker*`, `my-profile-host*`; copy —
[seeker profile](../wireframes/microcopy.md#my-profile-seekerhtml---loading---edit) і
[host profile](../wireframes/microcopy.md#my-profile-hosthtml---loading---edit).

- **Loading:** profile hub показує skeleton і недоступну основну дію.
- **Success:** hub показує identity, verification breakdown, completeness, reviews/cold-start і
  role-specific facts/actions; `.menu-row` веде до кабінетних функцій.
- **Edit:** form відкривається з поточними значеннями. Save повертає до відповідного hub;
  cancel не застосовує зміни.
- **Photo edge — Contract:** зміна фото негайно прибирає photo verification і вимагає re-verify.
  До повторного успіху badge не може продовжувати показувати старе `photo ✓`.
- **Represented:** додавання другої ролі починається з протилежного profile-create.
- **Documented gap/debt:** немає save-loading/error для edit, dirty-form guard, правил merge
  двох role profiles або точного redirect у re-verification (D-02, D-09).

## 9. Flow G — safety, support і account

Ця сім'я є частиною flow/sitemap, але її екрани лежать у `_archive/`. Їх статус — окремий
documented gap D-03; специфікація нижче фіксує лише вже описану поведінку, а не повертає екрани
до активного дизайн-набору.

Джерела: G3 у [flows.md](../flows.md#g3--скарга--блокування), екрани 15–19 і 24–26 у
[`_screens.md`](../wireframes/_screens.md#15-налаштування-приватності),
[`wireframes/_archive/README.md`](../wireframes/_archive/README.md), microcopy
[privacy/account/support](../wireframes/microcopy.md#privacy-settingshtml) і
[report](../wireframes/microcopy.md#reporthtml--report-loadinghtml--report-errorhtml--report-senthtml).

### 9.1 Report і block

- **Contract:** safety action доступна з іншого профілю, кімнати й chat.
- **Contract:** report проходить form → loading → sent або error → retry. Sent дає окремий
  вибір заблокувати людину чи повернутись.
- **Contract:** block прибирає людину зі стрічки й закриває chat; block зворотний через список
  blocked. Empty blocked-list є нормальним станом.
- **Contract:** report і block — різні дії; надсилання report не повинно мовчки блокувати.
- **Documented gap/debt:** requiredness reason, confirmation прямого block, стан chat після
  unblock і moderation outcomes не визначені (D-11).

### 9.2 Recovery, support, account, privacy

- Recovery без доступу до номера веде у support; автоматичного recovery немає.
- Support має form і loading, але не має documented error/sent state або каналу повернення
  результату в продукт.
- Privacy зберігає видимість фото до mutual interest і видимість віку; немає save-loading/error.
- Account дає logout і irreversible delete; склад даних, які видаляються, брати з
  [microcopy account](../wireframes/microcopy.md#accounthtml), але confirmation, re-auth,
  retention і failure behavior не визначені.
- Legal content доступний до надання consent і з profile hub; його чинність потребує окремого
  правового підтвердження, див. D-05.

## 10. Валідація: підтверджене та відсутнє

| Поверхня | Підтверджене правило | Не визначено — не вигадувати |
|---|---|---|
| Login phone | Телефон потрібен для SMS/login. | Формат, країни, нормалізація, маска, rate limit. |
| Login/verify code | UI називає код 6-значним; input обмежено максимум шістьма символами. | Мінімум, digits-only enforcement, expiry, attempts, resend cooldown. |
| Consent | Потрібні обидві окремі згоди; лише тоді continue enabled. | Invalid copy, версія consent, withdrawal flow. |
| Profile create | Фото обов'язкове; upload failure зберігає форму й блокує submit. | Requiredness/межі name, age, about, budget, district; допустимі image type/size. |
| Profile edit | Save оновлює видимі дані; photo change resets `photo ✓`. | Field rules, save error, concurrent edit, unsaved changes. |
| Listing create | Фото, ціна й район обов'язкові для published listing. | Межі price/date, required description/rules, photo count/type/size, draft. |
| Filters | Type/district/price/gender мають перелічені option states. | Комбінації, URL contract, persistence, zero-result telemetry. |
| Interest | Unverified user проходить verification; sent action не дублюється. | Duplicate scope person vs listing, expiration, resend after reject/withdraw. |
| Report | Flow вимагає вибір причини; details позначені optional у microcopy. | Чи reason технічно required, evidence attachments, abuse limits. |
| Support | Topic та description представлені формою. | Requiredness, email source, sent/error confirmation. |
| Chat | Composer існує у empty й success chat. | Empty/whitespace submit, max length, send error, edit/delete, attachments. |

У HTML майже немає `required`, `pattern`, `min` або `max`; це не означає, що всі значення
дозволені. Це означає, що wireframes не є достатнім validation contract. Компонентні патерни
форм див. у [UI-інвентарі](../ui/inventory.md#форми), а точну copy — у відповідній секції
`wireframes/microcopy.md`.

## 11. Реєстр documented gaps / debt

| ID | Рішення, якого бракує | Вплив на реалізацію | Джерело розриву |
|---|---|---|---|
| D-01 | Канонічний first-run і місце lazy verification. | Неможливо зафіксувати guard/redirect без ризику змінити продукт. | [Onboarding gap 4](./onboarding-gaps.md#4-який-канонічний-перший-запуск-і-момент-верифікації) |
| D-02 | Одна identity з двома ролями чи два role profiles; поведінка табів. | Data ownership, navigation, profile merge. | [Onboarding gap 5](./onboarding-gaps.md#5-яка-рольова-модель-продукту) |
| D-03 | Чи `_archive/` входить у release acceptance. | Launch-critical legal/support/recovery можуть не пройти handoff. | [Onboarding gap 6](./onboarding-gaps.md#6-що-означає-_archive-для-релізного-периметра) |
| D-04 | Interest state machine: scope, expiry, repeat, withdraw, reject, block. | Duplicate requests і неправильні chat gates. | [Onboarding gap 9](./onboarding-gaps.md#9-яка-state-machine-для-інтересу-заявки-й-чату) |
| D-05 | Verification provider, attempts N, retention, consent/legal contract, manual-review SLA. | Неможливо реалізувати безпечно й юридично прийнятно. | [Onboarding gap 7](./onboarding-gaps.md#7-який-реальний-контракт-верифікації-й-біометричних-даних) |
| D-06 | Rejected/silent destination vs mutual-only dialogs. | Суперечлива IA і route після негативного результату. | RJ3 `Rej/Silent → Back`; dialogs microcopy |
| D-07 | Chat failure/delivery/close behavior. | Немає recoverable send і правил закритого chat. | `_screens.md` прямо не моделює chat error |
| D-08 | Listing lifecycle transition table. | Visibility каталогу, candidates і rollback не визначені. | `_screens.md` називає стани без переходів |
| D-09 | Save error/dirty guard/re-verify redirect у profile edit. | Ризик втрати змін або хибного badge. | Активні edit-екрани мають лише success route |
| D-10 | Загальна async policy: timeout, retry, idempotency, stale data. | Подвійні мутації та невідомий результат після мережевої помилки. | Стани екранів без сервісного контракту |
| D-11 | Safety operations: confirmation, unblock semantics, moderation outcomes. | Блокування й скарга не мають повного lifecycle. | G3 + архівні states |
| D-12 | Єдиний словник system copy. | Одна сутність/дія має різні назви в різних states. | [Зведення microcopy](../wireframes/microcopy.md#зведення-неузгодженостей) |

## 12. Мінімальний acceptance для реалізації за цією специфікацією

Зміна поведінки готова до handoff лише якщо:

1. Кожен mutation має явні precondition, pending, success і recoverable failure або посилання
   на конкретний debt.
2. Empty, loading і error не підміняють одне одного; для каталогу збережено два типи empty.
3. Unverified user може browse, але не може обійти verification gate першого контакту.
4. Chat не створюється до mutual interest; sent/rejected/waiting не маскуються під dialog.
5. Upload error не стирає введені profile/listing data; повторний submit заблоковано в loading.
6. Зміна profile photo негайно скидає photo verification.
7. Block і report лишаються окремими діями; block має шлях розблокування.
8. UI copy береться з відповідної секції `microcopy.md`; її позначені неузгодженості не
   «виправляються» в одному екрані без системного рішення.
9. Prototype-only state links не потрапляють у продуктову навігацію.
10. Невизначена поведінка завершується посиланням на D-xx, а не прихованим припущенням у коді.
