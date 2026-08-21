# Куток

Куток — mobile-first вебзастосунок для безпечного пошуку кімнати або співмешканця в Києві, де в чинній мові «Каталог 73» Аня гортає спокійний упорядкований каталог і спершу бачить докази довіри до людини, а вже тоді вирішує, чи починати контакт; обґрунтування — у [concept.md](./concept.md).

## Запуск

Проєкт статичний: з кореня репозиторію виконайте `python3 -m http.server 8000`, а потім відкрийте [http://localhost:8000/](http://localhost:8000/). Для перегляду опублікованої версії доступний [kutok.vercel.app](https://kutok.vercel.app/); npm-скрипт для запуску застосунку не потрібен.

## Маршрут продукту

Почніть із [research/](./research/index.html) та [research.md](./research/research.md), а структуру рішень перевіряйте в [flows.md](./flows.md), [sitemap.md](./sitemap.md) і [ia.md](./ia.md). Голос, назви термінів і дій фіксує [voice.md](./voice.md), а точні рядки UI — [wireframes/microcopy.md](./wireframes/microcopy.md).

## Екрани

[Wireframes](./wireframes/index.html) — робочий набір екранів і їхніх станів; критерій активних 20 та архів задано в [wireframes/_screens.md](./wireframes/_screens.md). Спільні правила файлів і станів містить [wireframes/_conventions.md](./wireframes/_conventions.md).

## Дизайн-система й showcase

[DESIGN.md](./DESIGN.md) описує візуальні правила, [tokens.css](./design-system/tokens.css) — примітивні й semantic-токени, а [components/](./design-system/components/) — реалізації компонентів. Живу документацію компонентів відкривайте в [design-system/docs/](./design-system/docs/index.html), а практичний showcase оболонки й кіт — у [ui/shell.html](./ui/shell.html) та [ui/kit.html](./ui/kit.html).

## Адаптив і рух

[responsive/width-audit.md](./responsive/width-audit.md) фіксує ширинні рішення й перевірки адаптиву. [animations/motion-inventory.md](./animations/motion-inventory.md) — інвентар руху: які переходи допустимі, де вони застосовуються та як враховується reduced motion.

## Handoff

[Handoff-пакет](./handoff/README.md) задає порядок онбордингу; відкриті питання — в [onboarding-gaps.md](./handoff/onboarding-gaps.md), а підтверджені flow — в [behavior.md](./handoff/behavior.md). [map.md](./handoff/map.md) зводить активні екрани з компонентами, токенами та точними джерелами мікрокопі, а [a11y.md](./handoff/a11y.md) — доступнісні вимоги й точки перевірки.

## Контекст

[PRODUCT.md](./PRODUCT.md) — продуктовий контекст, [CLAUDE.md](./CLAUDE.md) — правила ведення артефактів, а [DESIGN-artifacts.md](./DESIGN-artifacts.md) — правила їхнього візуального подання. Змінюйте документи-джерела, а не їхні presentation-рендери, якщо конкретний артефакт не визначає інакше.
