# Куток

Мобільний веб-застосунок для пошуку співмешканців і підселення у вільні кімнати в Києві.

**Аудиторія:** 22–30 років, Київ.
**Головна цінність:** довіра і безпека при підселенні.
**Платформа:** mobile-first web · **Мова:** українська.

Детальний бриф → [CLAUDE.md](./CLAUDE.md)
**Live:** дашборд ресерчу → [kutok.vercel.app](https://kutok.vercel.app)

---

## Структура репо

| Папка | Що тут |
|-------|--------|
| [`research/`](./research/) | Ресерч: [research.md](./research/research.md) (конкуренти · бенчмарк · патерни · висновки · доресерч), [competitors.md](./research/competitors.md), [personas.md](./research/personas.md), [jtbd.md](./research/jtbd.md), [critique.md](./research/critique.md), [interviews.md](./research/interviews.md), [дашборд](./research/index.html) |
| [`research/screens/`](./research/screens/) | Скріни еталонів бенчмарку (Airbnb, Tinder); скріни конкурентів — TODO |
| [`wireframes/`](./wireframes/) | Wireframes потоків (low-fi) |
| [`concept/`](./concept/) | Концептуальні рішення, mood board, напрямки стилю |
| [`tokens/`](./tokens/) | Design tokens: кольори, типографіка, відступи |
| [`components/`](./components/) | Бібліотека компонентів |
| [`design-system/`](./design-system/) | Правила системи, гайдлайни, документація |
| [`handoff/`](./handoff/) | Специфікації та матеріали для розробки |

---

## Люди

Хто наші користувачі і що вони намагаються зробити — синтез із ресерчу, без вигадування (кожне твердження з джерелом або `[?]`).

- **[personas.md](./research/personas.md)** — 2–4 персони, кожна з контекстом, jobs, болями і тригерами довіри. **Primary — Аня, 23, «Переїзниця»** (переїхала до Києва без місцевої мережі; головний біль — довіра до незнайомця). Secondary: Олена (господар), Артем (місцевий шукач).
- **[jtbd.md](./research/jtbd.md)** — jobs у форматі «коли / хочу / щоб»: 1 main job + related/emotional/social + JTBD-матриця (jobs × персони × функції) з висновком «3 jobs у ядро MVP».
- **[critique.md](./research/critique.md)** — аудит персон і JTBD (підтверджено / гіпотеза / вигадано) + найнебезпечніші для дизайну твердження.
- Дірки з критики закрито **доресерчем** UA-джерел → [research.md](./research/research.md), розділ 5.

---

## Поточний етап

```
Research → [ тут зараз ] → Wireframes → Concept → Design → Handoff
```

Кабінетний ресерч **зібрано**: конкуренти, бенчмарк довіри, патерни, гіпотези R1–R5
→ [`research/research.md`](./research/research.md)
План інтерв'ю → [`research/interviews.md`](./research/interviews.md)

---

## Наступні кроки

1. Зняти скріни конкурентів (SpareRoom, Roomi, Badi, OLX) через Playwright → `research/screens/`
2. Провести інтерв'ю з шукачами та господарями (5–8 людей) → перевірити R1–R5 і H1–H4
3. Синтезувати інсайти → зафіксувати механізми довіри
4. Побудувати user flow для двох ролей → low-fi wireframes
