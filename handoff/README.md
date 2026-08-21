# Handoff-пакет Кутка

Цей пакет передає статичний прототип у реалізацію без перетворення демо-переходів на
непідтверджений backend-контракт. Його мета — дати новій людині межі продукту, поведінки,
UI-системи, доступності та відкритих рішень у порядку, безпечному для першої правки.

## Рекомендований порядок читання

1. [onboarding-gaps.md](./onboarding-gaps.md) — спершу закрийте P0-питання про deliverable,
   release perimeter, ролі, verification і джерела істини.
2. [behavior.md](./behavior.md) — далі прочитайте підтверджені flow, інваріанти й `D-xx` debt;
   невизначені правила не слід обирати в коді мовчки.
3. [map.md](./map.md) — зіставте активний екран із компонентами, semantic/primitive tokens та
   його точним джерелом тексту.
4. [a11y.md](./a11y.md) — перед завершенням правки звірте keyboard/focus, контраст, responsive
   contract і reduced motion.

## Джерела істини для copy

[voice.md](../voice.md) — джерело істини для тону, словника, звертання та назв дій.
[wireframes/microcopy.md](../wireframes/microcopy.md) — джерело істини для точного рядка,
екрана й стану; позначені в ньому неузгодженості не виправляйте локально без системного рішення.

## Локальний запуск і статичні перевірки

З кореня репозиторію запустіть `python3 -m http.server 8000`, після чого відкрийте
[http://localhost:8000/](http://localhost:8000/). Перед передаванням виконайте
`git diff --check`; для перевірки базових a11y-механізмів використовуйте команди з
[a11y.md](./a11y.md), а для меж responsive і motion —
[width audit](../responsive/width-audit.md) та [motion inventory](../animations/motion-inventory.md).

## Fresh-eyes criterion

Пакет пройшов fresh-eyes лише тоді, коли розробник, який не працював над проєктом, може без
додаткових пояснень запустити статичну поверхню, назвати активний та архівний периметр, простежити
рядок UI до `microcopy.md` і `voice.md`, пояснити gate або послатися на конкретний `D-xx`, а також
виконати перелічені статичні перевірки. Якщо будь-який із цих кроків потребує припущення, це новий
gap для `onboarding-gaps.md`, а не неявне рішення в реалізації.

## Випускний one-shot

[One-shot приклад](../examples/one-shot/index.html) і [prompt.md](../examples/one-shot/prompt.md)
— ізольований proof для post-MVP RJ5 «відгук після спільного проживання». Він не належить до
активних 20 екранів і не розширює їхній release perimeter.

## Release links

| Поверхня | Посилання | Статус |
|---|---|---|
| Репозиторій | [github.com/denysosadchyi/kutok](https://github.com/denysosadchyi/kutok) | доступний |
| Showcase (GitHub Pages) | [denysosadchyi.github.io/kutok/](https://denysosadchyi.github.io/kutok/) | planned |
| Product (GitHub Pages) | [denysosadchyi.github.io/kutok/wireframes/listings.html](https://denysosadchyi.github.io/kutok/wireframes/listings.html) | planned |
| Product mirror | [kutok.vercel.app](https://kutok.vercel.app/) | existing mirror |

Планові GitHub Pages URL стануть live лише після merge в `main` і успішного Pages workflow; цей
документ не стверджує їхню поточну HTTP-доступність.
