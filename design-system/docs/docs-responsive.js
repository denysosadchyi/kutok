/* Реальний wireframe у документації: ширина фрейму змінює CSS-медіаумови
   самого макета, а не лише його масштаб у прев'ю. */
(() => {
  const views = [
    { key: 'mobile', label: 'Mobile', width: 390 },
    { key: 'tablet', label: 'Tablet', width: 760 },
    { key: 'desktop', label: 'Desktop', width: 1080 },
  ];

  document.querySelectorAll('.docs-responsive').forEach((preview) => {
    const sourceFor = (view) => preview.dataset[view.key];
    if (views.some((view) => !sourceFor(view))) return;

    const controls = document.createElement('div');
    controls.className = 'docs-responsive-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Ширина макета');

    const stage = document.createElement('div');
    stage.className = 'docs-responsive-stage';

    const frame = document.createElement('iframe');
    frame.className = 'docs-responsive-frame';
    frame.loading = 'lazy';
    frame.title = 'Макет для адаптивної перевірки';
    stage.append(frame);

    const buttons = new Map();
    const select = (selected) => {
      const source = sourceFor(selected);
      stage.style.setProperty('--docs-preview-width', `${selected.width}px`);
      stage.dataset.viewport = selected.key;
      frame.title = `${selected.label} ${selected.width}px: макет для адаптивної перевірки`;
      if (frame.getAttribute('src') !== source) frame.src = source;
      buttons.forEach((button, key) => {
        button.setAttribute('aria-pressed', String(key === selected.key));
      });
    };

    views.forEach((view) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'docs-responsive-control';
      button.textContent = `${view.label} ${view.width}`;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => select(view));
      controls.append(button);
      buttons.set(view.key, button);
    });

    preview.replaceChildren(controls, stage);
    select(views[0]);
  });
})();
