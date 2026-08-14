#!/usr/bin/env bash
# Перезбірка standalone-бандла тулбара Agentation.
#
# Навіщо окрема збірка, а не npm-пакет прямо в проєкті: Куток — статичні
# HTML-екрани (wireframes/*.html), без бандлера й без React-застосунку.
# Щоб підключити React-компонент Agentation (npm-пакет agentation, той
# самий що на hp у splitmart-frontend), його треба один раз зібрати разом
# з react/react-dom в один самодостатній <script> — далі кожна HTML-сторінка
# просто підключає готовий файл тегом <script src="/dev/agentation.js"></script>,
# без npm і без збірки на льоту.
#
# Запуск: bash dev/build/build.sh  (з будь-якої директорії — шляхи нижче
# рахуються відносно цього файлу).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d node_modules ]; then
  echo "node_modules немає — виконую npm install…"
  npm install
fi

./node_modules/.bin/esbuild entry.jsx \
  --bundle \
  --minify \
  --format=iife \
  --target=es2020 \
  --define:process.env.NODE_ENV='"production"' \
  --loader:.js=jsx \
  --outfile=../agentation.js

echo "Готово: $(cd .. && pwd)/agentation.js ($(du -h ../agentation.js | cut -f1))"
