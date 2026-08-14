# dev — тулбар Agentation

## Що це

Куток — статичні HTML-екрани (`wireframes/*.html`), без React-застосунку і
без бандлера в проді. Оригінал тулбара Agentation підключався React-
компонентом у проєкті splitmart-frontend (React SPA, hp) — див.
`dev/_src/annotator.local.tsx`, там же пояснення двох тонких місць, які
збережені й тут (пропуск оболонки-навігатора, endpoint від `location.hostname`
замість `localhost`).

Тут React-компонента немає куди монтуватись «природно» — кожен HTML-файл
самостійний документ. Тому Agentation + React + ReactDOM зібрані заздалегідь
в один самодостатній файл `dev/agentation.js`, і кожен екран підключає його
звичайним `<script src="/dev/agentation.js"></script>` в кінці `<body>`.
Ніякого npm, білда чи CDN на самій сторінці — просто статичний JS, який
працює офлайн у LAN.

## Файли

- `dev/agentation.js` — готовий бандл (IIFE, мінімізований, React/ReactDOM
  всередині). Це артефакт збірки — не редагувати руками, перезбирати через
  `build.sh`.
- `dev/build/` — тека збірки: власний `package.json` (не залежить від
  кореневого проєкту), `entry.jsx` (джерело), `build.sh` (перезбірка).
  `dev/build/node_modules/` у git не потрапляє (`.gitignore`).
- `dev/_src/annotator.local.tsx` — оригінал з React-проєкту, залишений як
  довідка про контракт (endpoint, яка сторінка пропускається і чому).

## Чому standalone-IIFE, а не npm-пакет у проєкті

Проєкт навмисно без бандлера — сторінки редагуються й переглядаються як
звичайний HTML/CSS через nginx на :8901. Заводити збірку заради одного
дев-інструмента означало б тягнути весь тулинг у прод-дерево екранів. IIFE-
бандл — це компроміс: React живе лише всередині одного файлу, сторінки
лишаються чистим HTML, а підключення — один `<script>` тег.

## Де саме монтується тулбар

Кореневий `/index.html` — оболонка-навігатор: ліва панель + `<iframe id="frame">`,
у якому вона показує обраний екран. Якщо змонтувати тулбар і в оболонці, і в
екрані всередині iframe — вийдуть два живих екземпляри, і зовнішній
марний: обробники подій, обхід DOM і геометрія елементів не перетинають межу
iframe, тож він міг би анотувати лише хром самої навігації, а не макет під
рецензією, і при цьому заважав би внутрішньому тулбару в тому ж кутку екрана.

`entry.jsx` визначає оболонку не по URL (і кореневий `/index.html`, і
`/wireframes/index.html` формально «index.html», але другий — це реальний
екран-список вайрфреймів, де тулбар потрібен), а по структурній ознаці DOM:
наявності `<iframe id="frame">`. Це унікальний елемент саме оболонки-
навігатора. Якщо оболонку колись переверстають і `id="frame"` зникне — ознаку
треба буде поправити разом з нею.

## Як підключити тулбар на екрані

```html
<script src="/dev/agentation.js"></script>
```

Один тег у кінці `<body>` — тулбар сам вирішить, монтуватись чи ні (дивиться
`document.querySelector('iframe#frame')`), і сам візьме endpoint з
`location.hostname:4747`, щоб працювати і на локальній машині, і з інших
хостів у LAN, з яких відкривають :8901.

## Як перезібрати

```bash
bash dev/build/build.sh
```

Перший запуск сам зробить `npm install` у `dev/build/`, якщо `node_modules`
немає. Результат — оновлений `dev/agentation.js` в корені `dev/`.

Версії залежностей зафіксовані в `dev/build/package.json`:
`agentation@^3.0.2`, `react@^18.3.1`, `react-dom@^18.3.1`, `esbuild` — та сама
мажорна версія agentation, що й на hp у splitmart-frontend.

## Перевірено

- `dev/agentation.js` існує, не порожній (≈540 КБ), у ньому немає
  верхньорівневих `require(` — не впаде в браузері.
- Синтаксична валідність: `node -e "new Function(fs.readFileSync('dev/agentation.js','utf8'))"` —
  без `SyntaxError`.
- Реальне монтування через `google-chrome --headless --dump-dom`: скрипт,
  підключений усередину iframe з `/wireframes/index.html`, створює
  `#agentation-root`; той самий скрипт усередині iframe з кореневого
  `/index.html` — ні.

---

# dev — серверна частина (вердикти, черга, вартовий)

Перенесено зі splitmart-frontend (машина hp) на kutok (машина den).
Три незалежні сервіси, кожен — окремий systemd user-юніт.

## Сервіси

| Юніт | Порт | Що робить | Файл |
|---|---|---|---|
| `kutok-annotations.service` | 4747 | `agentation-mcp server` — приймає анотації з тулбара (SQLite `~/.agentation/store.db`) | `dev/mcp/node_modules/.bin/agentation-mcp` |
| `kutok-fixlog.service` | 4748 | вердикти рев'ювера + черга доробок (`/rate`, `/rework`, `/rework-done`) | `dev/fixlog-server.mjs` → `dev/fixlog-ratings.json` |
| `kutok-dispatcher.service` | — | вартовий: раз на 18с опитує `:4747/pending` і `:4748/rework`, на кожну одиницю запускає headless `claude -p … --dangerously-skip-permissions` з cwd=`/home/den/kutok` | `/home/den/.local/share/kutok-dispatcher/dispatcher.py` |

`agentation-mcp` встановлено окремо від тулбарного білда (`dev/build/`), у
власній теці `dev/mcp/` з власним `package.json`/`node_modules` — щоб не
зіткнутись із `npm install` тулбара.

## Увімкнути / вимкнути

```bash
# статус усіх трьох
systemctl --user status kutok-annotations kutok-fixlog kutok-dispatcher

# перезапуск одного
systemctl --user restart kutok-dispatcher

# зупинити все (наприклад, на час ручного рев'ю)
systemctl --user stop kutok-annotations kutok-fixlog kutok-dispatcher
```

Юніти в `~/.config/systemd/user/`, `WantedBy=default.target`, увімкнені
(`enable --now`); `loginctl show-user den` вже мав `Linger=yes`, тож сервіси
живуть і без активної SSH-сесії den.

## Рубильник вартового

Вартовий — єдиний з трьох сервісів, що САМ запускає роботу (headless
Claude-агентів у робочому дереві). Файл-рубильник:

```
/home/den/.kutok-dispatcher.off
```

Якщо він існує — вартовий кожну ітерацію логує «РУБИЛЬНИК … нову роботу не
беру» і не бере нічого нового з черги; уже запущені виконавці дороблюють.
Прибрати рубильник:

```bash
rm /home/den/.kutok-dispatcher.off
```

**Станом на розгортання рубильник УВІМКНЕНО** — вартовий нічого не запускає,
доки користувач не вирішить прибрати файл.

## Логи

- вартовий: `/home/den/.local/share/kutok-dispatcher/dispatcher.log` (ротація
  зрізом при 5 МБ, лишає останній ~1 МБ) + лог кожного прогону-виконавця в
  `/home/den/.local/share/kutok-dispatcher/runs/`
- annotations / fixlog: `journalctl --user -u kutok-annotations -f` /
  `journalctl --user -u kutok-fixlog -f`

## Перевірено

```
curl -s http://127.0.0.1:4747/pending   → {"count":0,"annotations":[]}
curl -s http://127.0.0.1:4747/status    → {"mode":"local", …}
curl -s http://127.0.0.1:4748/health    → {"ok":true}
curl -s http://127.0.0.1:4748/ratings   → {}
curl -s http://127.0.0.1:4748/rework    → {"count":0,"items":[]}
```

Усі три `systemctl --user status` — `active (running)`. `ss -ltnp` підтверджує
4747 і 4748 слухають. Вартовий стартував і одразу побачив рубильник (лог:
«РУБИЛЬНИК … нову роботу не беру»).

## Що змінено відносно splitmart-frontend

- Шляхи: `/home/hp/splitmart-frontend` → `/home/den/kutok`,
  `/home/hp` → `/home/den`.
- `fixlog-server.mjs`: `FILE` → `dev/fixlog-ratings.json`.
- `dispatcher.py`: `FIXLOG_MD` → `dev/fixlog.md` (був `public/fixlog.md`,
  React-проєкт fixlog.md тримав у `public/`); брифи згадують «екран
  `/wireframes/…`» замість «React-роут».
- Пункт «sibling-перевірка» в брифах переформульовано під CLAUDE.md kutok:
  токени → `design-system/tokens.css`, правило компонента →
  `design-system/components/` (+ обов'язковий `build.sh` після правки),
  розмітка компонента → `ui/kit.html`; правка лише на одному екрані —
  розсинхрон, який ловить аудит. У splitmart це був інший критерій (рольові
  близнюки React-компонентів), у kutok — цей.
- systemd-юніти перейменовані `splitmart-*` → `kutok-*`, `node`/`python3`
  прописані абсолютним шляхом (`which node`/`which python3` на цій машині),
  бо для user-юнітів PATH не гарантовано містить nvm.
- Логіка dispatcher.py й fixlog-server.mjs НЕ змінена — перенесення
  точкове, чотири задокументовані рішення (ack до запуску, спільний ліміт
  воркерів, стан на диску лише для доробок, ротація лога зрізом) і
  рубильник лишились як були.
