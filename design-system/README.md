# Дизайн-система Кутка

Самодостатній каталог спільних токенів, CSS-компонентів і живої документації.

## Структура

- `tokens.css` містить кольори, типографіку, відступи, радіуси й брейкпоінти.
- `components/` містить вихідні стилі компонентів. Порядок підключення задає `components/manifest.txt`.
- `components/index.css` генерується зі стилів компонентів і не редагується вручну.
- `components/select.css` входить у manifest одразу після `field.css`: це progressive-enhancement стиль для нативних `<select>` у `.fsel`.
- `index.css` є публічною точкою входу: підключайте саме його.
- `docs/` містить живий каталог компонентів: [відкрити документацію](docs/index.html).

## Підключення

```html
<link rel="stylesheet" href="design-system/index.css">
```

## Збірка компонентів

Після змін у `components/` або `components/manifest.txt` перезберіть агрегований файл:

```bash
bash design-system/components/build.sh
```
