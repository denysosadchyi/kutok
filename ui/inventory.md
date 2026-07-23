# UI-інвентар — Куток

> Інвентар компонентів **усього продукту**, знятий із `wireframes/*.html` (74 файли, включно зі станами) і звірений із ролями/екранами [sitemap.md](../sitemap.md). Охоплює і пофарбовані екрани (мова «Каталог 73»: `listings*`, `my-profile-seeker`), і ще-сірі вайрфрейми (решта) — компонент той самий незалежно від того, чи він уже пофарбований.
>
> **Правило відбору:** у таблицю потрапляє тільки те, що реально повторюється на **двох і більше екранах**. Одиничні блоки — у списку [«Разове»](#разове) внизу. Нічого не додано «на майбутнє» — лише те, що стоїть у розмітці.
>
> **Екран ≠ стан.** У колонці «Екрани» — базові екрани; варіанти `-empty` / `-error` / `-loading` / `-edit` зведені в колонку «Стани». `index.html` — оболонка-навігатор вайрфреймів, не продуктовий екран, тому виключений.

---

## Навігація

| Компонент | Екрани | Стани | Фото? |
|---|---|---|---|
| **Таб-бар (нижня навігація)** | Усі екрани застосунку після входу (~69). Немає лише на пре-авторизаційних: `login*`, `role-select` | 4 таби (Пошук / Заявки / Чати / Профіль); активний = поточний розділ; лічильник-бейдж на Заявки/Чати (у «Каталог 73» — морквяний, у сірих — сірий `tab-badge`) | Ні (контурні іконки) |
| **Хедер екрана** | Майже всі. Два варіанти: вордмарк-хедер (`head-word`) — `listings*`, `my-profile-seeker`; «назад + заголовок» (`app-name`/`screen-title`/`backlink`) — `room`, `chat`, `report`, `verify*`, `consent`, `account`, `blocked`, `privacy-settings`, `legal`, `recovery`, `my-listings`, `profile`, `support`, `room-create`, `*-edit` | З кнопкою «← назад» / без неї; вордмарк-варіант із великим заголовком-назвою таба | Ні |
| **Поповер пошуку** | `listings*`, `my-profile-seeker` | Закритий / відкритий (кнопка-лупа в хедері) | Ні |
| **Список-меню налаштувань** (`menu-row`) | `my-profile-seeker`, `my-profile-host` | Рядок = іконка + лейбл + шеврон, веде в під-екрани (приватність, заблоковані, акаунт, підтримка, умови) | Ні |

---

## Картки й списки

| Компонент | Екрани | Стани | Фото? |
|---|---|---|---|
| **Картка оголошення (каталог-картка)** | `listings` (+ стани), `listings-desktop` | Успіх; у `-loading` замінюється скелетоном; у `-empty` відсутня | **Так** (фото кімнати / людини) |
| **Рядок списку (медіа-рядок)** | `dialogs`, `candidates`, `applications`, `my-listings`, `blocked` | З прев'ю та лічильником непрочитаних (dialogs); з діями «Прийняти/Відхилити» (candidates); зі статусом життєвого циклу (my-listings); «Розблокувати» (blocked); скелетон у `-loading`; відсутній у `-empty` | **Так** (аватар/мініатюра) |
| **Аватар / фото-плейсхолдер** (`thumb`, `avatar`, `room-photo`) | `profile`, `room`, `chat`, `candidates`, `dialogs`, `applications`, `my-profile-*`, `profile-create-*`, `*-edit`, `verify-selfie`, `photo-viewer`, `listings-desktop` | Розміри: `sm` / кругла аватарка / велике фото кімнати; плейсхолдер-текст «фото» у сірих | **Так** |
| **Бейдж верифікації** | `listings*`, `my-profile-seeker` (пофарбовані: `.verified` / `.profile-badge`); `applications`, `candidates`, `listings-desktop`, `my-profile-host`, `profile` (+`-empty`/`-error`), `room` (+`-error`), `verify` (сірий `.badge`) | Комбінації «телефон / фото / документ» (`✓` або `—`); олива-галочка (пофарбований) vs текстовий (сірий). У `chat` і в блоці господаря `room` та сама інформація йде текстом у «рядку людини» (`host-name`), не цим компонентом | Ні |
| **Факти / чипи** (`facts`, `pchips`) | `room`, `profile`, `account`, `my-profile-host`, `my-profile-seeker` | Список умов співжиття / чипи-звички | Ні |
| **Рядок людини (співрозмовник / господар)** | `chat` (шапка-peer), `room` (рядок господині) | Співрозмовник у чат-шапці / господар у картці кімнати | **Так** (мала аватарка) |
| **Метр повноти профілю** | `my-profile-seeker`, `my-profile-host` (+ `-loading`) | Відсоток заповнення; скелетон у `-loading` | Ні |
| **Лічильник результатів** (`counter`) | `candidates`, `listings-desktop`, `my-profile-host`, `photo-viewer` (+ у станах завантаження `dialogs-loading`, `my-listings-loading`) | «N кандидатів» / «i з N фото» | Ні |
| **Статус-піґулка** (`status`) | `applications`, `my-listings` | «очікує» / «відхилено» / «→ перенесено в чат» (applications); «Активне» / «Зайнято» (my-listings) | Ні |

> **Доповнення кіту при перенесенні ролі «Шукач» на `ui/kit.css`** (бракували компоненти → спершу сюди, потім у сірі екрани):
> - `.status-pill` — статус-піґулка (рядок вище).
> - `.sk-line` — загальний скелетон-рядок тексту (рядок заявки й профіль, що вантажаться).
> - `.feed`, `.filterbar` — витягнуті з `listings.html` як окремі класи (раніше жили тільки як частина великого layout-блоку); тепер підключаються до кожного екрана зі стрічкою/рядками.
> - `.pad`, `.section` — layout-утиліти без власного рядка в таблиці (не компоненти, а обгортки відступів): `.pad` (відступ секції) і `.section` (`.pad` + розділювач `--line` знизу) — консолідують сірий `.pad`/безіменні `<section>`-блоки.
> - `.profile-hero` (+ `.profile-name`, `.profile-bio`) — центрований блок ідентичності профілю, витягнутий з `my-profile-seeker.html`.
> - `.btn--pill` — модифікатор кнопки для «Редагувати профіль» (пігулка замість прямокутника).
> - `.fab` доповнено sticky-позиціюванням, `.sheet` — модифікатором `.sheet--popover` (фіксація до низу в'юпорта): це була частина «вигляду» компонента, а не адресації конкретної сторінки.

---

## Форми

| Компонент | Екрани | Стани | Фото? |
|---|---|---|---|
| **Кнопка дії (первинна)** | Майже всі екрани з дією (~55): `room`, `candidates`, `chat` (Надіслати), `consent`, `login*`, `report*`, `room-create*`, `profile-create-*`, `verify*`, `listings-empty`/`-error`, `my-listings*`, `*-edit`, `recovery`, `role-select` | Звичайна / `sm` | Ні |
| **Вторинна кнопка (ghost)** | `room`, `room-create`, `profile` (+`-empty`/`-error`), `profile-create-*`, `chat`, `verify-code` («ще раз»), `verify`, `account`, `photo-viewer`, `report-sent`, `login-error`, `my-profile-*-edit` | `ghost` / `sm ghost` | Ні |
| **Поле форми** (input / textarea / select + `label`) | `login*`, `verify-phone*`, `verify-code*`, `room-create*`, `report*`, `support*`, `profile-create-*`, `*-edit`, `listings-desktop`; випадні списки — фільтр `listings*` (`fsel`) | Порожнє / заповнене / поряд банер помилки; select із кастомною стрілкою | Ні |
| **Чекбокс** (`chk` / `chk-line`) | `consent`, `room-create*`, `profile-create-seeker*`, `verify`, `my-profile-seeker-edit` | Увімкнений / вимкнений | Ні |
| **Радіо-список** (`radio-option`) | `report*`, `privacy-settings` | Один вибраний з переліку | Ні |
| **Ряд завантаження фото** (`photo-row`) | `room-create*`, `profile-create-seeker*`, `profile-create-host*`, `my-profile-*-edit` | Порожній слот / з прев'ю завантаженого | **Так** (прев'ю фото) |

---

## Зворотний зв'язок

| Компонент | Екрани | Стани | Фото? |
|---|---|---|---|
| **Порожній стан** (`state-block`) | `listings-empty`, `listings-empty-coldstart`, `listings-error`, `applications-empty`, `blocked-empty`, `candidates-empty`, `chat-empty`, `dialogs-empty`, `my-listings-empty` | Нема результатів (вузький фільтр) / cold-start (нема бази) / офлайн-помилка — з іконкою, заголовком, текстом і кнопками | Ні (іконка) |
| **Банер** (`banner`) | `login-error`, `profile-create-host-error`, `profile-create-seeker-error`, `profile-error`, `report-error`, `report-sent`, `room-create-error`, `room-error`, `verify-code-error`, `verify-error`, `verify-pending`, `verify-phone-error`, `verify-selfie-error`, `candidates-empty` | Помилка / успіх (`report-sent`) / інфо (`verify-pending`, `candidates-empty`) | Ні |
| **Скелетон завантаження** (`sk`) | `listings-loading`, `applications-loading`, `chat-loading`, `my-listings-loading`, `my-profile-host-loading`, `my-profile-seeker-loading`, `profile-loading`, `room-loading`, `verify-loading` | Форма контенту, що вантажиться: картка / профіль / чат | Ні |
| **Пояснювальний текст** (`hint`) | ~50 екранів (підзаголовок під заголовком, поради безпеки в чаті, підказки форм) | Підзаголовок / порада / підказка поля | Ні |

---

## Чат

| Компонент | Екрани | Стани | Фото? |
|---|---|---|---|
| **Бульбашка чату** (`msg`) | `chat` (+ `-loading`) | Вхідне (`in`) / вихідне (`out`); скелетон-бульбашки у `-loading` | Ні |
| **Поле вводу повідомлення** (`composer`) | `chat`, `chat-empty`, `chat-loading` | Активне; присутнє навіть у порожньому чаті | Ні |

*(Шапку співрозмовника винесено вище, у «Картки й списки» → «Рядок людини», бо той самий компонент стоїть і в `room`.)*

---

## Разове

> Блоки, що стоять лише на **одному** екрані (або одному екрані з його станами). У кіт компонентів не тягнемо — фіксуємо, що вони існують.

- **Сегмент типу «Кімнати / Люди / Усі»** (`seg`) — тільки `listings*`.
- **FAB фільтра + боттом-шит фільтра** (`fab`, `sheet-*`) — тільки `listings*`.
- **Крок-чекліст верифікації** (`step`) — екрани верифікаційного флоу (`verify*`, `verify-selfie-error`); одна послідовність, тому не окремий компонент.
- **Стрічка мініатюр кімнати** (`thumb-strip`) — тільки `room*`.
- **Опції вибору ролі** (`role-option`) — тільки `role-select` (кнопки-опції, не картки).
- **Повноекранний фото-в'юер** — тільки `photo-viewer`.
- **Блок згоди + чек-лінії** (`consent-block`) — тільки `consent`.
- **Легал-лінки** (`legal-links`) — тільки `consent`.

---

*Знято з `wireframes/*.html` + [sitemap.md](../sitemap.md), 2026-07-22. Тільки те, що реально в розмітці. Пов'язане: [DESIGN.md](../DESIGN.md) (візуальна мова пофарбованих компонентів), [concept.md](../concept.md).*
