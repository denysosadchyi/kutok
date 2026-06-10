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
| [`research/`](./research/) | Ресерч: [research.md](./research/research.md) (конкуренти · бенчмарк · патерни · висновки), [competitors.md](./research/competitors.md), [interviews.md](./research/interviews.md), [дашборд](./research/index.html) |
| [`research/screens/`](./research/screens/) | Скріни еталонів бенчмарку (Airbnb, Tinder); скріни конкурентів — TODO |
| [`wireframes/`](./wireframes/) | Wireframes потоків (low-fi) |
| [`concept/`](./concept/) | Концептуальні рішення, mood board, напрямки стилю |
| [`tokens/`](./tokens/) | Design tokens: кольори, типографіка, відступи |
| [`components/`](./components/) | Бібліотека компонентів |
| [`design-system/`](./design-system/) | Правила системи, гайдлайни, документація |
| [`handoff/`](./handoff/) | Специфікації та матеріали для розробки |

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
