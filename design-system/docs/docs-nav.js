(() => {
  const taxonomy = [
    {
      title: 'Overview',
      items: [
        { href: 'index.html', label: 'Компоненти' },
        { href: 'why.html', label: 'Чому система така' },
      ],
    },
    {
      title: 'Foundations',
      catalog: 'Основа мови: токени, правила та текстові ролі, з яких складаються всі інші компоненти.',
      items: [
        { href: 'text.html', label: 'Текст: лічильник, оверлайн, підказка', component: true },
        { href: '../../viewer.html?f=design-system/tokens.css', label: 'Токени CSS' },
        { href: '../../viewer.html?f=DESIGN.md', label: 'DESIGN.md' },
        { href: '../../viewer.html?f=design-system/README.md', label: 'README дизайн-системи' },
      ],
    },
    {
      title: 'Atoms',
      catalog: 'Найменші самостійні елементи інтерфейсу: контрол, ідентичність, сигнал або компактна дія.',
      items: [
        { href: 'button.html', label: 'Кнопка', component: true },
        { href: 'field.html', label: 'Поле форми', component: true },
        { href: 'checkbox.html', label: 'Чекбокс', component: true },
        { href: 'radio.html', label: 'Радіо-список', component: true },
        { href: 'avatar.html', label: 'Аватар', component: true },
        { href: 'badge.html', label: 'Бейдж верифікації', component: true },
        { href: 'status-pill.html', label: 'Статус-піґулка', component: true },
        { href: 'fab.html', label: 'FAB фільтра', component: true },
      ],
    },
    {
      title: 'Molecules',
      catalog: 'Малі зв’язки атомів, що виконують одну конкретну дію або подають один компактний факт.',
      items: [
        { href: 'search.html', label: 'Поповер пошуку', component: true },
        { href: 'chips.html', label: 'Факти й чипи', component: true },
        { href: 'segment.html', label: 'Сегмент типу', component: true },
        { href: 'meter.html', label: 'Метр повноти профілю', component: true },
        { href: 'photo-upload.html', label: 'Ряд завантаження фото', component: true },
        { href: 'banner.html', label: 'Банер', component: true },
        { href: 'role-option.html', label: 'Опції вибору ролі', component: true },
      ],
    },
    {
      title: 'Organisms',
      catalog: 'Складені блоки екрана: навігація, контентні одиниці та повні функціональні зони.',
      items: [
        { href: 'header.html', label: 'Хедер екрана', component: true },
        { href: 'tabbar.html', label: 'Таб-бар', component: true },
        { href: 'menu.html', label: 'Список-меню налаштувань', component: true },
        { href: 'card.html', label: 'Картка оголошення', component: true },
        { href: 'list.html', label: 'Рядок списку', component: true },
        { href: 'review.html', label: 'Відгук', component: true },
        { href: 'profile-hero.html', label: 'Профіль-герой', component: true },
        { href: 'sheet.html', label: 'Боттом-шит', component: true },
        { href: 'gallery.html', label: 'Фото-в’юер', component: true },
        { href: 'thumb-strip.html', label: 'Стрічка мініатюр', component: true },
        { href: 'chat.html', label: 'Бульбашки й поле вводу', component: true },
      ],
    },
    {
      title: 'Patterns & States',
      catalog: 'Повторювані сценарії системи: стани, згода, приватність і довге читання.',
      items: [
        { href: 'state.html', label: 'Порожній стан', component: true },
        { href: 'skeleton.html', label: 'Скелетон завантаження', component: true },
        { href: 'consent.html', label: 'Блок згоди', component: true },
        { href: 'privacy-group.html', label: 'Група приватності', component: true },
        { href: 'legal-copy.html', label: 'Юридичний текст', component: true },
      ],
    },
    {
      title: 'Templates & Screens',
      items: [
        { href: '../../wireframes/listings.html', label: 'Живий екран каталогу' },
        { href: '../../wireframes/listings-desktop.html', label: 'Каталог на широкому екрані' },
        { href: '../../viewer.html?f=responsive/width-audit.md', label: 'Аудит ширини й архетипи' },
      ],
    },
  ];

  const componentGroups = taxonomy.filter((group) => group.catalog);
  const currentBasename = () => {
    const pathname = window.location.pathname;
    const basename = pathname.slice(pathname.lastIndexOf('/') + 1);
    return basename.includes('.') ? basename : 'index.html';
  };

  const makeBrand = () => {
    const brand = document.createElement('a');
    brand.className = 'docs-nav-home';
    brand.href = 'index.html';
    brand.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3H18L21 6V21H3Z" fill="var(--color-brand)"/><path d="M18 3L21 3L21 6Z" fill="var(--bg-surface)"/></svg>Куток · дизайн-система';
    return brand;
  };

  const makeLink = (item, current) => {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;
    if (item.href === current) link.setAttribute('aria-current', 'page');
    return link;
  };

  const buildNavigation = (nav) => {
    const current = currentBasename();
    const fragment = document.createDocumentFragment();
    fragment.append(makeBrand());

    const sub = document.createElement('p');
    sub.className = 'docs-nav-sub';
    sub.textContent = 'Atomic Design';
    fragment.append(sub);

    taxonomy.forEach((group) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'docs-nav-group';

      const heading = document.createElement('h3');
      heading.textContent = group.title;
      wrapper.append(heading);

      const list = document.createElement('ul');
      group.items.forEach((item) => {
        const entry = document.createElement('li');
        entry.append(makeLink(item, current));
        list.append(entry);
      });
      wrapper.append(list);
      fragment.append(wrapper);
    });

    nav.replaceChildren(fragment);
  };

  const regroupCatalog = () => {
    const catalog = document.querySelector('[data-docs-catalog]');
    if (!catalog) return;

    const oldSections = [...catalog.querySelectorAll('.docs-cat')];
    const cardByHref = new Map();
    oldSections.forEach((section) => {
      section.querySelectorAll('.docs-card').forEach((card) => {
        const link = card.querySelector('.docs-card-link');
        if (link) cardByHref.set(link.getAttribute('href'), card);
      });
    });

    const firstSection = oldSections[0];
    if (!firstSection) return;

    const fragment = document.createDocumentFragment();
    componentGroups.forEach((group) => {
      const section = document.createElement('section');
      section.className = 'docs-cat';

      const heading = document.createElement('h2');
      heading.textContent = group.title;
      section.append(heading);

      const intro = document.createElement('p');
      intro.textContent = group.catalog;
      section.append(intro);

      const grid = document.createElement('div');
      grid.className = 'docs-grid';
      group.items.filter((item) => item.component).forEach((item) => {
        const card = cardByHref.get(item.href);
        if (card) grid.append(card);
      });
      section.append(grid);
      fragment.append(section);
    });

    catalog.insertBefore(fragment, firstSection);
    oldSections.forEach((section) => section.remove());
  };

  document.querySelectorAll('[data-docs-nav]').forEach(buildNavigation);
  regroupCatalog();
})();
