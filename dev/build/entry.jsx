/* Entry-точка standalone-збірки тулбара Agentation для статичного HTML-проєкту
   "Куток". Оригінал (React-версія з splitmart-frontend) — dev/_src/annotator.local.tsx,
   разом з поясненням двох речей, які тут навмисно збережені:

   1. Не монтуємось у оболонці-навігаторі (кореневий /index.html: ліва панель
      + iframe, що показує обраний екран). Там React SPA визначав це через
      react-router pathname === '/'. Тут немає роутера й немає єдиної точки
      входу — кожен HTML-файл підключає цей бандл сам по собі, — тож ознаку
      треба брати з DOM, а не з URL.

      Чому не pathname: /wireframes/index.html — це РЕАЛЬНИЙ екран (список
      вайрфреймів), там тулбар потрібен, а кореневий /index.html теж
      формально "index.html". Розрізняти по імені файлу — крихко.

      Натомість перевіряємо наявність <iframe id="frame"> — це унікальна
      структурна ознака саме оболонки-навігатора (див. index.html, де iframe
      з таким id — це полотно, в яке вона вантажить екрани). Жоден екран
      вайрфрейму такого елемента не має. Якщо колись оболонку переверстають
      і id зміниться — цей файл треба поправити разом з нею, це нормально:
      ознака свідомо прив'язана до конкретної розмітки, а не вгадується.

   2. endpoint береться з location.hostname, а не хардкодиться як localhost —
      бо nginx на :8901 віддає ці сторінки і в LAN (з інших машин парку, див.
      кореневий CLAUDE.md), де "localhost" означає ЛОКАЛЬНУ машину глядача,
      а не хост, де крутиться nginx і слухає MCP-сервер на :4747. */
import { createRoot } from 'react-dom/client'
import { Agentation } from 'agentation'

function isNavigatorShell() {
  return document.querySelector('iframe#frame') !== null
}

function mount() {
  if (isNavigatorShell()) return

  const host = document.createElement('div')
  host.id = 'agentation-root'
  document.body.appendChild(host)

  const root = createRoot(host)
  root.render(
    <Agentation endpoint={`http://${location.hostname}:4747`} />
  )
}

// Скрипт підключається як звичайний <script> в кінці <body> (не type=module,
// не defer) — на момент виконання document.body вже існує і в табі, і в
// iframe, тож DOMContentLoaded не потрібен.
mount()
