#!/usr/bin/env bash
# Збирає design-system/components/index.css з окремих файлів компонентів.
#
# Навіщо збірка, а не @import: ланцюжок @import змушує браузер спершу забрати
# й розпарсити index.css, і лише тоді запитати решту 29 файлів. Заміряно
# (аудит /impeccable, 2026-07-29): 31 CSS-запит і ~145 мс до останнього файлу
# проти 2 запитів і ~50 мс у зібраного. На реальній мережі з latency різниця
# більша: зайвий раунд-трип плюс черга з'єднань HTTP/1.1.
#
# Джерело істини — окремі файли компонентів. index.css генерований: правити
# його руками не можна, зміни зітруться наступною збіркою.
#
# Порядок файлів задає manifest.txt. Запуск: bash design-system/components/build.sh
set -euo pipefail
cd "$(dirname "$0")"

OUT=index.css
{
  echo "/* ==========================================================================="
  echo "   Куток — components/index.css · ЗГЕНЕРОВАНО, НЕ РЕДАГУВАТИ"
  echo "   Джерело — окремі файли компонентів у цій теці; порядок — manifest.txt."
  echo "   Перезібрати: bash design-system/components/build.sh"
  echo "   =========================================================================== */"
  echo
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in \#*) continue;; esac
    echo "/* ── $f ────────────────────────────────────────────────────────────── */"
    cat "$f"
    echo
  done < manifest.txt
} > "$OUT.tmp"

mv "$OUT.tmp" "$OUT"
echo "index.css зібрано з $(grep -cvE '^\s*(#|$)' manifest.txt) файлів ($(wc -c < "$OUT") байт)"
