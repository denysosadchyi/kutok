#!/usr/bin/env python3
"""Постійний вартовий черги правок Agentation для splitmart-frontend.

ЧОМУ ЦЕЙ ФАЙЛ ЛЕЖИТЬ ПОЗА РЕПОЗИТОРІЄМ
Він не є частиною продукту і не має версіонуватись разом із ним: це
інфраструктура однієї машини (шляхи /home/hp, порти 4747/4748, юзерський
systemd). У git йому місця немає — так само, як `public/fixlog.md`, який
теж git-excluded.

ЩО ВІН РОБИТЬ
Раз на POLL_SECONDS питає два джерела роботи:
  * :4747 /pending  — нові анотації з тулбара Agentation;
  * :4748 /rework   — правки, які рев'ювер завернув на доробку.
На кожну одиницю роботи запускає headless-виконавця
(`claude -p … --dangerously-skip-permissions`) з робочою текою репозиторію.
`CLAUDE.md` там підхоплюється сам, тож бриф несе тільки дані задачі —
дублювати в ньому правила проєкту було б і зайвим, і шкідливим (дві копії
правил розходяться).

ЧОТИРИ РІШЕННЯ, ЯКІ ВИГЛЯДАЮТЬ ЗАЙВИМИ І НЕ Є

1. ACKNOWLEDGE ПЕРЕД ЗАПУСКОМ, А НЕ ПІСЛЯ.
   `GET /pending` віддає лише анотації зі статусом 'pending'. Щойно ми
   робимо PATCH {status:'acknowledged'}, анотація зникає з видачі. Це і є
   замок від подвійного взяття: якщо поруч живе друга Claude-сесія зі своїм
   agentation-mcp (а вона живе — сесія піднімає свій екземпляр, який просто
   не займає порт), обидва читають ОДИН SQLite-стор, і виграє той, хто
   першим переведе статус. Ставити ack після запуску виконавця означало б
   вікно в кілька секунд, у яке та сама правка розходиться двом агентам.

2. ЛІМІТ ВИКОНАВЦІВ, СПІЛЬНИЙ НА ОБИДВА ДЖЕРЕЛА.
   Не через CPU — через репозиторій: паралельні headless-агенти в одній
   робочій теці ризикують зіткнутись на спільному CSS. Ліміт спільний, бо
   доробка з /rework — це та сама правка того самого файла, а не окремий
   клас роботи. Разом із ним працює WORKER_TIMEOUT: без стелі на прогін
   зависла правка тримає слот довічно, і черга з чотирьох воркерів вироджується
   в чергу з нуля. Убитий по таймауту прогін лишає рядок у `public/fixlog.md`
   і один раз повертається в чергу — див. report_timeout().

3. СТАН НА ДИСКУ ЛИШЕ ДЛЯ ДОРОБОК.
   Анотації самозамикаються статусом (п.1) — пам'ять їм не потрібна.
   А `/rework` віддає позицію доти, доки хтось не поставить done, і якщо
   виконавець упав, не поставивши, наступна ітерація взяла б її знову —
   і так вічно. Тому id відправленої доробки лягає у state.json НАЗАВЖДИ,
   а не «до завершення»: повторний автоматичний запуск того, що вже раз
   впало, дає нескінченний цикл, а не другий шанс. Другий шанс дає людина
   (див. `rework_dispatched` нижче — рядок звідти можна прибрати руками).

4. РОТАЦІЯ ЛОГА ЗРІЗОМ, А НЕ logrotate.
   logrotate вимагає окремого юніта, конфіга і прав; тут достатньо: як
   файл переріс LOG_MAX_BYTES, лишаємо останній LOG_KEEP_BYTES і дописуємо
   маркер. Втрачається найстаріше — саме те, що нікому не потрібне.

ДУБЛІ
id анотації не є ідентичністю роботи: тулбар перезаливає свої локальні копії
під новими id. Тому, по-перше, виконавцям заборонено робити DELETE (видалене
заливається знову — це і був генератор дублів), по-друге, на вході кожна
анотація зводиться до підпису «роут + елемент + текст», і якщо така робота вже
зроблена або саме йде, анотація закривається як resolved без запуску. Підписи
живуть у state.json, тож відсів працює і між рестартами. Див. work_sig().

СИРОТИ
Раз на SWEEP_EVERY ітерацій вартовий звіряє `acknowledged` анотації з тим, що
насправді живе в ОС. Виконавець, який пережив рестарт (KillMode=process), для
нового вартового невидимий, і без цієї звірки його зависання нікому помітити.
Живий, але переліз WORKER_TIMEOUT — усиновлюємо, щоб убити; процесу немає
взагалі — анотація повертається в чергу. І те, і те лишає рядок у fixlog.md.

РУБИЛЬНИК
Якщо існує файл KILL_SWITCH, ітерація нічого не запускає. Перевірка —
ПЕРША дія циклу, до будь-якого мережевого запиту: сенс рубильника в тому,
щоб він діяв миттєво й безумовно, навіть коли сервери відповідають сміттям.
Уже запущені виконавці при цьому дороблюють — рубильник спиняє видачу
нової роботи, а не вбиває чужу транзакцію на середині.
"""

import json
import os
import re
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

# ── Конфігурація ────────────────────────────────────────────────────────
HOME = "/home/hp"
BASE = f"{HOME}/.local/share/splitmart-dispatcher"
REPO = f"{HOME}/splitmart-frontend"
CLAUDE = f"{HOME}/.local/bin/claude"

ANNOTATIONS = "http://127.0.0.1:4747"
FIXLOG = "http://127.0.0.1:4748"

FIXLOG_MD = f"{REPO}/public/fixlog.md"

LOG_FILE = f"{BASE}/dispatcher.log"
STATE_FILE = f"{BASE}/state.json"
RUNS_DIR = f"{BASE}/runs"
KILL_SWITCH = f"{HOME}/.splitmart-dispatcher.off"

POLL_SECONDS = 18
# Чотири паралельні правки. Стеля тут не про CPU (агент майже весь час чекає
# на модель), а про те, скільки одночасних записів у репозиторій ще можна
# розплутати руками, якщо двоє агентів зачепили той самий файл.
MAX_WORKERS = 4
# Стеля на одну правку. Прогін, що переліз за неї, не «повільний» — він
# завис: жоден із живих прогонів не тривав більше 6.5 хв, а ті, що висіли
# годинами, не закінчувались ніколи. Убивство після ліміту звільняє слот і
# лишає слід у таблиці, замість тихо тримати чергу.
WORKER_TIMEOUT = 15 * 60

LOG_MAX_BYTES = 5 * 1024 * 1024
LOG_KEEP_BYTES = 1 * 1024 * 1024

HTTP_TIMEOUT = 10


# ── Лог ─────────────────────────────────────────────────────────────────
def rotate_log():
    try:
        if os.path.getsize(LOG_FILE) <= LOG_MAX_BYTES:
            return
    except OSError:
        return
    try:
        with open(LOG_FILE, "rb") as f:
            f.seek(-LOG_KEEP_BYTES, os.SEEK_END)
            f.readline()  # не залишати обрізаний рядок на початку
            tail = f.read()
        stamp = datetime.now().isoformat(timespec="seconds")
        head = f"--- лог зрізано {stamp}, лишено останній ~1 МБ ---\n".encode()
        tmp = LOG_FILE + ".tmp"
        with open(tmp, "wb") as f:
            f.write(head + tail)
        os.replace(tmp, LOG_FILE)
    except OSError as e:
        sys.stderr.write(f"rotate failed: {e}\n")


def log(msg):
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n"
    rotate_log()
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line)
    sys.stdout.write(line)
    sys.stdout.flush()


# ── HTTP ────────────────────────────────────────────────────────────────
def http(method, url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as r:
        body = r.read().decode("utf-8", "replace")
    return json.loads(body) if body else {}


def http_quiet(method, url, payload=None):
    """Для опитування: недоступний сервер — це нормальний стан (перезапуск,
    ще не піднявся після ребуту), а не подія, якою варто засипати лог."""
    try:
        return http(method, url, payload)
    except (urllib.error.URLError, OSError, ValueError):
        return None


# ── Стан ────────────────────────────────────────────────────────────────
def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            s = json.load(f)
        if not isinstance(s, dict):
            raise ValueError("root is not an object")
        s.setdefault("rework_dispatched", {})
        s.setdefault("timeouts", {})
        s.setdefault("done_sigs", {})
        return s
    except (OSError, ValueError):
        return {"rework_dispatched": {}, "timeouts": {}, "done_sigs": {}}


def save_state(state):
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    os.replace(tmp, STATE_FILE)


# ── Журнал правок ───────────────────────────────────────────────────────
# Звичайно в `public/fixlog.md` пише сам виконавець, останнім кроком свого
# прогону. Убитий виконавець цього кроку не доживе — рядок за нього пише
# вартовий, інакше зупинка ніде не видно: анотація зникає з черги, у таблиці
# порожньо, і назовні це виглядає як «правку зробили».
#
# Дописуємо строго в кінець файлу через O_APPEND і одним write(). У той самий
# файл у цю мить пишуть інші виконавці; read-modify-write затер би їхні рядки,
# а один append коротший за PIPE_BUF лягає цілим. Секції в лозі йдуть за
# датами, тож «кінець файлу» — це завжди сьогоднішня секція.

def md_cell(text):
    """`|` рве розмітку таблиці, перенос рядка рве рядок таблиці."""
    return str(text).replace("|", "\\|").replace("\n", " ").strip()


def append_fixlog_row(cells):
    today = datetime.now().strftime("%Y-%m-%d")
    chunk = ""
    try:
        with open(FIXLOG_MD, encoding="utf-8") as f:
            body = f.read()
        if not body.endswith("\n"):
            chunk += "\n"
        if f"\n## {today}" not in body:
            chunk += (f"\n## {today}\n\n"
                      "| Час | Трив. | Роут | Запит | Маршрут | Що зроблено |\n"
                      "|---|---|---|---|---|---|\n")
        chunk += "| " + " | ".join(md_cell(c) for c in cells) + " |\n"
        with open(FIXLOG_MD, "a", encoding="utf-8") as f:
            f.write(chunk)
    except OSError as e:
        log(f"не зміг дописати рядок у {FIXLOG_MD}: {e}")


# ── Брифи ───────────────────────────────────────────────────────────────
# Правил проєкту тут немає свідомо: виконавець стартує з cwd=REPO і читає
# CLAUDE.md сам. У брифі — тільки те, чого він звідти не дізнається.

FIELDS = (
    "id", "comment", "url", "element", "elementPath", "cssClasses",
    "fullPath", "computedStyles", "nearbyText", "selectedText",
    "reactComponents", "intent", "severity",
)


def annotation_brief(a):
    payload = {k: a[k] for k in FIELDS if a.get(k) not in (None, "")}
    aid = a["id"]
    return f"""Правка з тулбара Agentation. Дані анотації:

{json.dumps(payload, ensure_ascii=False, indent=2)}

Зроби:
1. Полагодь те, що описано в `comment`, на роуті `{a.get('url', '?')}`.
2. Sibling-перевірка за правилами CLAUDE.md — обов'язковий рядок про неї.
3. Допиши рядок у таблицю в кінці `public/fixlog.md`
   (`| HH:MM | Трив. | роут | запит | agent | що зроблено |`;
   якщо секції за сьогоднішню дату ще немає — заведи її).
4. Наприкінці, і тільки після того як правка справді зроблена, закрий анотацію:
   curl -s -X PATCH {ANNOTATIONS}/annotations/{aid} \\
     -H 'Content-Type: application/json' \\
     -d '{{"status":"resolved","resolvedBy":"agent"}}'
   НЕ роби DELETE. Тулбар тримає свої анотації в localStorage браузера і
   перезаливає на сервер кожну, чийого id сервер не знає, — тобто кожну
   видалену. Вона повертається новим id зі старим часом, і та сама правка
   їде в роботу вдруге. `resolved` лишає запис на місці й розриває це коло.

Якщо правку зробити не вдалося — НЕ resolve і НЕ delete. Замість цього
поверни анотацію в чергу, щоб її побачила людина:
   curl -s -X PATCH {ANNOTATIONS}/annotations/{aid} \\
     -H 'Content-Type: application/json' -d '{{"status":"pending"}}'
"""


def rework_brief(item):
    rid = item["id"]
    note = item.get("rework", {}).get("note", "")
    route = rid.split("|", 1)[1] if "|" in rid else "?"
    return f"""Доробка після рев'ю. Попередню правку завернули.

Рядок у `public/fixlog.md`: `{rid}`  (час | роут)
Роут: {route}
Зауваження рев'ювера: «{note}»

Зроби:
1. Знайди в `public/fixlog.md` рядок з цим часом і роутом — там описано, що
   було зроблено минулого разу. Виправ саме те, на що вказує зауваження.
2. Sibling-перевірка за правилами CLAUDE.md — обов'язковий рядок про неї.
3. Допиши в таблицю `public/fixlog.md` НОВИЙ рядок із поміткою **rework:**
   у колонці запиту. Старий рядок не переписуй — лог append-only.
4. Наприкінці, і тільки після того як доробку справді зроблено:
   curl -s -X POST {FIXLOG}/rework-done \\
     -H 'Content-Type: application/json' \\
     -d {json.dumps(json.dumps({"id": rid}, ensure_ascii=False))}

Якщо зробити не вдалося — НЕ став rework-done. Напиши чому в stdout.
"""


# ── Виконавці ───────────────────────────────────────────────────────────
class Worker:
    def __init__(self, kind, key, label, brief, route="?", request="", sig=""):
        self.kind = kind          # 'annotation' | 'rework'
        self.key = key
        self.label = label
        # Роут і текст запиту тримаємо окремо від label: якщо прогін доведеться
        # вбити, вартовий сам заповнить ними колонки таблиці.
        self.route = route
        self.request = request
        # Підпис роботи (не id!) — за ним відсіюються дублі, див. work_sig().
        self.sig = sig
        self.started = time.time()
        self.timed_out = False
        safe = re.sub(r"[^A-Za-z0-9_.-]", "_", key)[:80]
        self.log_path = f"{RUNS_DIR}/{time.strftime('%Y%m%d-%H%M%S')}-{safe}.log"
        self.fh = open(self.log_path, "w", encoding="utf-8")
        self.fh.write(f"=== {label}\n=== {datetime.now().isoformat()}\n\n{brief}\n\n--- вивід ---\n")
        self.fh.flush()
        self.proc = subprocess.Popen(
            [CLAUDE, "-p", brief, "--dangerously-skip-permissions"],
            cwd=REPO,
            stdin=subprocess.DEVNULL,
            stdout=self.fh,
            stderr=subprocess.STDOUT,
            # Своя група процесів: `claude` плодить дітей (node, tsc, vite),
            # і вбивати треба всю гілку, інакше після таймауту лишається
            # сирота, яка й далі пише в репозиторій.
            start_new_session=True,
        )

    def poll(self):
        rc = self.proc.poll()
        if rc is None and time.time() - self.started > WORKER_TIMEOUT:
            self.timed_out = True
            log(f"ТАЙМАУТ {int(WORKER_TIMEOUT / 60)}хв: {self.label} — вбиваю групу {self.proc.pid}")
            try:
                os.killpg(self.proc.pid, signal.SIGKILL)
            except OSError:
                pass
            return self.proc.wait()
        return rc

    def close(self):
        try:
            self.fh.close()
        except OSError:
            pass


# ── Дублі ───────────────────────────────────────────────────────────────
# id анотації НЕ є ідентичністю роботи. Тулбар перезаливає свої локальні копії
# під новими id, користувач тицяє той самий елемент двічі, а після rework той
# самий екран приходить ще раз — і в усіх випадках id різний, а робота одна.
#
# Ідентичність роботи — це «який екран + який елемент + що просять». Підпис
# із цих трьох і є ключем: він переживає зміну id, зберігається в state.json
# і тому діє між рестартами, а не лише в межах одного циклу.
#
# Дубль не видаляємо, а закриваємо як resolved: видалене тулбар заллє ще раз
# (див. п.4 брифу), і відсів перетворився б на нескінченну гойдалку.
SIG_KEEP = 3000                  # скільки підписів тримати; далі — найстаріші геть


def work_sig(a):
    route = urllib.parse.urlparse(a.get("url") or "").path or "?"
    text = re.sub(r"\s+", " ", (a.get("comment") or "")).strip().lower()
    where = (a.get("elementPath") or a.get("cssClasses") or "").strip()
    return f"{route}\u0000{where}\u0000{text}"


def remember_sig(state, sig):
    if not sig:
        return
    done = state["done_sigs"]
    done[sig] = datetime.now().isoformat(timespec="seconds")
    if len(done) > SIG_KEEP:
        for k in sorted(done, key=done.get)[:len(done) - SIG_KEEP]:
            done.pop(k, None)
    save_state(state)


def take_annotations(state, workers):
    """Взяти нові анотації. Кожна спершу ack-ається (замок), потім запуск."""
    resp = http_quiet("GET", f"{ANNOTATIONS}/pending")
    if resp is None:
        return
    inflight = {w.sig for w in workers if w.sig}
    for a in resp.get("annotations", []):
        if len(workers) >= MAX_WORKERS:
            return
        aid = a.get("id")
        if not aid:
            continue
        sig = work_sig(a)
        # Та сама робота вже зроблена або саме йде — закрити, не запускати.
        # Порядок важливий: перевірка ДО ack, щоб на дубль не витрачався навіть
        # замок, і одна й та сама анотація не миготіла між станами.
        was = state["done_sigs"].get(sig)
        if was or sig in inflight:
            why = "вже в роботі" if sig in inflight else f"вже зроблено {was}"
            try:
                http("PATCH", f"{ANNOTATIONS}/annotations/{aid}",
                     {"status": "resolved", "resolvedBy": "dedupe"})
                log(f"ДУБЛЬ {aid} · {a.get('url', '?')} · «{(a.get('comment') or '')[:60]}» — {why}")
            except Exception as e:                              # noqa: BLE001
                log(f"дубль {aid} не закрився ({e}) — спробую наступної ітерації")
            continue
        inflight.add(sig)
        try:
            http("PATCH", f"{ANNOTATIONS}/annotations/{aid}", {"status": "acknowledged"})
        except Exception as e:                                  # noqa: BLE001
            # Не взяли замок — або сервер моргнув, або нас випередили.
            # В обох випадках правильна дія одна: не запускати.
            log(f"ack {aid} не вдався ({e}) — пропускаю до наступної ітерації")
            continue
        comment = (a.get("comment") or "")[:120].replace("\n", " ")
        label = f"анотація {aid} · {a.get('url', '?')} · «{comment}»"
        log(f"ВЗЯВ {label}")
        route = urllib.parse.urlparse(a.get("url") or "").path or "?"
        w = Worker("annotation", aid, label, annotation_brief(a), route, comment, sig)
        workers.append(w)
        log(f"  → pid {w.proc.pid}, лог {w.log_path}")


def take_reworks(state, workers):
    resp = http_quiet("GET", f"{FIXLOG}/rework")
    if resp is None:
        return
    dispatched = state["rework_dispatched"]
    dirty = False
    for item in resp.get("items", []):
        if len(workers) >= MAX_WORKERS:
            break
        rid = item.get("id")
        if not rid or rid in dispatched:
            continue
        note = (item.get("rework", {}).get("note") or "")[:120].replace("\n", " ")
        label = f"доробка {rid} · «{note}»"
        dispatched[rid] = datetime.now().isoformat(timespec="seconds")
        dirty = True
        save_state(state)  # запис ДО запуску: краще не запустити, ніж запустити двічі
        log(f"ВЗЯВ {label}")
        route = rid.split("|", 1)[1] if "|" in rid else "?"
        w = Worker("rework", rid, label, rework_brief(item), route, f"rework: {note}")
        workers.append(w)
        log(f"  → pid {w.proc.pid}, лог {w.log_path}")
    if dirty:
        save_state(state)


def reap(state, workers):
    for w in list(workers):
        rc = w.poll()
        if rc is None:
            continue
        w.close()
        workers.remove(w)
        mins = (time.time() - w.started) / 60
        verdict = "готово" if rc == 0 else f"КОД {rc}"
        if rc == 0 and not w.timed_out:
            # Робота дійшла до кінця — підпис у пам'ять, щоб її копія, яку
            # тулбар заллє завтра, не поїхала в роботу вдруге.
            remember_sig(state, w.sig)
        if w.timed_out:
            verdict = f"ЗУПИНЕНО по таймауту {int(WORKER_TIMEOUT / 60)}хв"
            report_stop(state, w.key, w.kind, w.route, w.request,
                        mins, w.log_path, 'timeout')
        log(f"ЗАВЕРШИВ {w.label} — {verdict}, {mins:.1f}хв, лог {w.log_path}")


def report_stop(state, key, kind, route, request, mins, log_path, cause):
    """Слід від зупиненого прогону: рядок у таблиці + доля самої анотації.

    Перша зупинка — повертаємо в `pending`: зависання буває випадкове
    (модель залипла на одному інструменті), і другий захід зазвичай проходить.
    Друга по тій самій анотації — лишаємо в `acknowledged` і більше не
    чіпаємо, інакше вона довіку тримала б слот і плодила однакові рядки.
    Тоді єдиний її слід — цей рядок у таблиці, і розбирається з ним людина.

    `cause` розрізняє дві смерті, які з боку черги виглядають однаково:
    'timeout' — прогін не вклався в ліміт і його вбито;
    'orphan'  — виконавця вже немає, а анотацію він за собою не закрив."""
    counts = state["timeouts"]
    n = counts.get(key, 0) + 1
    counts[key] = n
    save_state(state)

    retry = kind == "annotation" and n < 2
    verdict = ("Повернув у чергу — це перша зупинка, наступний захід може пройти."
               if retry else
               f"Зупиняється {n}-й раз — більше не перезапускаю, розбирайся руками.")
    head = (f"**Зупинено вартовим.** Прогін перевищив ліміт "
            f"{int(WORKER_TIMEOUT / 60)}хв — процес і всю його гілку вбито."
            if cause == "timeout" else
            "**Сирота.** Виконавця вже немає, а анотацію він за собою не "
            "закрив — найчастіше його забрав рестарт вартового.")
    append_fixlog_row([
        datetime.now().strftime("%H:%M"),
        f"{mins:.1f}хв",
        f"`{route}`",
        f"«{request}»",
        "таймаут" if cause == "timeout" else "сирота",
        f"{head} Правку не зроблено або зроблено частково: перевір `git diff` "
        f"перед тим як перезапускати. {verdict}"
        + (f" Лог прогону: `{log_path}`" if log_path else ""),
    ])
    if retry:
        try:
            http("PATCH", f"{ANNOTATIONS}/annotations/{key}", {"status": "pending"})
        except Exception as e:                                  # noqa: BLE001
            log(f"не зміг повернути {key} у чергу після зупинки: {e}")


# ── Сироти ──────────────────────────────────────────────────────────────
# Дірка, яку це закриває: `KillMode=process` лишає живими виконавців, коли
# вартового перезапускають, і новий вартовий про них НЕ знає. Анотація в них
# уже `acknowledged`, тобто з /pending зникла; якщо такий виконавець зависне
# або впаде, не закривши її, вона не повернеться в чергу ніколи. Ліміт
# WORKER_TIMEOUT її теж не дістане — він живе в об'єкті Worker, якого немає.
#
# Тому раз на SWEEP_EVERY ітерацій вартовий дивиться на систему, а не на свою
# пам'ять: бере всі `acknowledged` анотації й питає ОС, чи існує ще процес,
# який над ними працює. Виконавця впізнаємо по його ж брифу — id анотації в
# нього в командному рядку.

SWEEP_EVERY = 10                 # ітерацій, ~3 хв при POLL_SECONDS = 18
# Фора між ack і появою процесу. Ack ставиться до запуску (навмисно, див.
# п.1 угорі), і ще ack може поставити паралельна Claude-сесія зі своїм
# agentation-mcp — її процес виглядає інакше. П'ять хвилин на це з запасом.
ORPHAN_GRACE = 5 * 60


def live_runs():
    """id анотації → (pid, скільки секунд живе) для кожного виконавця в ОС."""
    out = {}
    try:
        boot_uptime = float(open("/proc/uptime").read().split()[0])
        ticks = os.sysconf("SC_CLK_TCK")
    except (OSError, ValueError):
        return out
    for pid in os.listdir("/proc"):
        if not pid.isdigit():
            continue
        try:
            with open(f"/proc/{pid}/cmdline", "rb") as f:
                cmd = f.read().replace(b"\0", b" ").decode("utf-8", "replace")
            if "claude" not in cmd or "Agentation" not in cmd:
                continue
            m = re.search(r'"id":\s*"([\w-]+)"', cmd)
            if not m:
                continue
            stat = open(f"/proc/{pid}/stat").read()
            # 22-е поле — starttime у тіках від завантаження системи; назва
            # процесу в дужках може містити пробіли, тож ріжемо після ')'.
            start = float(stat[stat.rindex(")") + 2:].split()[19]) / ticks
            out[m.group(1)] = (int(pid), max(0.0, boot_uptime - start))
        except (OSError, ValueError, IndexError):
            continue
    return out


def acknowledged_annotations():
    """Усі `acknowledged` анотації. Окремої ручки для них у сервера немає —
    доводиться обходити сесії, тому й робимо це рідко, а не щоітерації."""
    sessions = http_quiet("GET", f"{ANNOTATIONS}/sessions")
    if not isinstance(sessions, list):
        return None
    found = []
    for s in sessions:
        d = http_quiet("GET", f"{ANNOTATIONS}/sessions/{s.get('id')}")
        if not isinstance(d, dict):
            continue
        for a in d.get("annotations", []):
            if a.get("status") == "acknowledged" and not a.get("resolvedAt"):
                found.append(a)
    return found


def age_of(a):
    """Скільки секунд анотація висить у роботі: від ack (updatedAt), а якщо
    його чомусь немає — від створення."""
    stamp = a.get("updatedAt") or a.get("createdAt")
    if not stamp:
        return 0.0
    try:
        t = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    except ValueError:
        return 0.0
    return max(0.0, (datetime.now(timezone.utc) - t).total_seconds())


def find_run_log(aid):
    """Останній лог прогону цієї анотації — щоб рядок у таблиці вів кудись."""
    try:
        hits = sorted(f for f in os.listdir(RUNS_DIR) if f.endswith(f"-{aid}.log"))
    except OSError:
        return ""
    return f"{RUNS_DIR}/{hits[-1]}" if hits else ""


def sweep_orphans(state, workers):
    mine = {w.key for w in workers}
    acked = acknowledged_annotations()
    if acked is None:
        return
    live = live_runs()
    for a in acked:
        aid = a.get("id")
        if not aid or aid in mine:
            continue                      # свій виконавець — ним займається reap()
        route = urllib.parse.urlparse(a.get("url") or "").path or "?"
        request = (a.get("comment") or "")[:120].replace("\n", " ")
        run = live.get(aid)
        if run:
            pid, secs = run
            if secs <= WORKER_TIMEOUT:
                continue                  # живий і в межах ліміту — хай працює
            # Живий, але переліз ліміт, і слідкувати за ним нікому. Той самий
            # ліміт, що й для своїх: усиновлюємо рівно для того, щоб убити.
            log(f"СИРОТА-ТАЙМАУТ {aid} · pid {pid} · {secs / 60:.1f}хв — вбиваю групу")
            try:
                os.killpg(pid, signal.SIGKILL)
            except OSError as e:
                log(f"  не вбив {pid}: {e}")
            report_stop(state, aid, "annotation", route, request,
                        secs / 60, find_run_log(aid), "timeout")
            continue
        age = age_of(a)
        if age < ORPHAN_GRACE:
            continue                      # щойно взяли — процес міг не встигнути
        log(f"СИРОТА {aid} · виконавця немає, висить {age / 60:.1f}хв — повертаю в чергу")
        report_stop(state, aid, "annotation", route, request,
                    age / 60, find_run_log(aid), "orphan")


def main():
    os.makedirs(RUNS_DIR, exist_ok=True)
    state = load_state()
    workers = []
    log(f"старт диспетчера, pid {os.getpid()}, ліміт {MAX_WORKERS}, опитування {POLL_SECONDS}с")
    off_announced = False
    # Нуль, а не SWEEP_EVERY: перший обхід сиріт іде ОДРАЗУ на старті. Саме
    # старт — момент, коли сироти й з'являються (нас щойно перезапустили), і
    # чекати три хвилини, щоб це помітити, немає причин.
    tickno = 0

    while True:
        try:
            # Рубильник — перша дія ітерації, до будь-якої мережі.
            if os.path.exists(KILL_SWITCH):
                if not off_announced:
                    log(f"РУБИЛЬНИК {KILL_SWITCH} — нову роботу не беру "
                        f"(у роботі зараз: {len(workers)})")
                    off_announced = True
                reap(state, workers)
                time.sleep(POLL_SECONDS)
                continue
            if off_announced:
                log("рубильник знято — продовжую")
                off_announced = False

            reap(state, workers)
            # ДО взяття нової роботи: обхід може повернути анотацію в чергу,
            # і тоді вона поїде в роботу тією ж ітерацією, а не наступною.
            if tickno % SWEEP_EVERY == 0:
                sweep_orphans(state, workers)
            tickno += 1
            if len(workers) < MAX_WORKERS:
                take_annotations(state, workers)
            if len(workers) < MAX_WORKERS:
                take_reworks(state, workers)
        except Exception as e:                                  # noqa: BLE001
            # Вартовий, який падає від однієї несподіванки, — не вартовий.
            # systemd його підніме, але між падінням і підйомом черга стоїть.
            log(f"ПОМИЛКА ітерації: {type(e).__name__}: {e}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
