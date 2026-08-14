(function () {
  function ready() {
    var nav = document.querySelector('.wf-nav');
    if (!nav) return;
    var stage = document.querySelector('.wf-stage');

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'wf-nav-toggle';
    button.textContent = 'Макети';
    button.setAttribute('aria-controls', 'wf-review-nav');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Відкрити навігацію макетів');
    nav.id = nav.id || 'wf-review-nav';
    document.body.appendChild(button);

    function setOpen(open) {
      document.body.classList.toggle('wf-nav-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Закрити навігацію макетів' : 'Відкрити навігацію макетів');
      button.textContent = open ? 'Закрити' : 'Макети';
      if (stage) {
        stage.inert = open;
        stage.setAttribute('aria-hidden', open ? 'true' : 'false');
      }
      if (open) {
        var first = nav.querySelector('a, button, input, summary');
        if (first) first.focus({ preventScroll: true });
      } else {
        button.focus({ preventScroll: true });
      }
    }

    button.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('wf-nav-open'));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a[href]') && window.matchMedia('(max-width: 47.49rem)').matches) {
        setOpen(false);
      }
    });

    document.addEventListener('click', function (event) {
      if (!document.body.classList.contains('wf-nav-open')) return;
      if (nav.contains(event.target) || button.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('wf-nav-open')) setOpen(false);
    });

    window.matchMedia('(min-width: 47.5rem)').addEventListener('change', function (event) {
      if (event.matches) setOpen(false);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
}());
