(function () {
  'use strict';

  var draftKey = 'kutok-rj5-review-draft';

  function readDraft() {
    try {
      return sessionStorage.getItem(draftKey) || '';
    } catch (error) {
      return '';
    }
  }

  function writeDraft(value) {
    try {
      sessionStorage.setItem(draftKey, value);
    } catch (error) {
      /* The static example still works without draft persistence. */
    }
  }

  function injectProductNavigation() {
    document.querySelectorAll('[data-product-nav]').forEach(function (footer) {
      footer.innerHTML = [
        '<a class="tabbar-brand" href="../../wireframes/listings.html" aria-label="Куток — на головну">',
        '<svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3H18L21 6V21H3Z" fill="var(--color-brand)"/><path d="M18 3L21 3L21 6Z" fill="var(--bg-surface)"/></svg><span>Куток</span></a>',
        '<form class="tabbar-search search-form" role="search" action="../../wireframes/listings.html" method="get">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.8 16.8L21 21"/></svg>',
        '<input type="search" name="q" placeholder="Пошук" aria-label="Пошук оголошень"></form>',
        '<a href="../../wireframes/listings.html"><span class="tab-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.8 16.8L21 21"/></svg></span><span class="tab-txt">Пошук</span></a>',
        '<a href="../../wireframes/applications.html"><span class="tab-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8.5 8.5h7M8.5 12.5h7M8.5 16.5h4"/></svg></span><span class="tab-txt">Заявки</span></a>',
        '<a href="../../wireframes/dialogs.html"><span class="tab-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.6a8.6 8.6 0 1 0-7.5-4.4L3.4 20.6l4.5-1.1a8.56 8.56 0 0 0 4.1 1.1z"/></svg></span><span class="tab-txt">Чати</span></a>',
        '<a class="active" href="../../wireframes/my-profile-seeker.html" aria-current="page"><span class="tab-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.7"/><path d="M5 20.2c1.3-3.5 3.9-5.2 7-5.2s5.7 1.7 7 5.2"/></svg></span><span class="tab-txt">Профіль</span></a>'
      ].join('');
    });
  }

  function restoreDraft() {
    var draft = readDraft();
    var field = document.querySelector('[data-review-input]');
    var output = document.querySelector('[data-review-output]');

    if (field && draft) field.value = draft;
    if (output && draft) {
      output.textContent = draft;
      output.closest('.review').hidden = false;
    }
  }

  function wireReviewForm() {
    var form = document.querySelector('[data-review-form]');
    if (!form) return;

    var field = form.querySelector('[data-review-input]');
    var error = form.querySelector('[data-review-error]');
    var preview = document.querySelector('[data-review-preview]');

    function showError() {
      field.setAttribute('aria-invalid', 'true');
      error.hidden = false;
      field.focus();
    }

    function updatePreview() {
      var value = field.value.trim();
      writeDraft(field.value);
      if (preview) {
        preview.textContent = value || 'Текст відгуку з’явиться тут.';
        preview.classList.remove('is-updating');
        void preview.offsetWidth;
        preview.classList.add('is-updating');
      }
      if (value) {
        field.removeAttribute('aria-invalid');
        error.hidden = true;
      }
    }

    field.addEventListener('input', updatePreview);
    field.addEventListener('invalid', function (event) {
      event.preventDefault();
      showError();
    });
    form.addEventListener('submit', function (event) {
      if (!field.value.trim()) {
        event.preventDefault();
        showError();
        return;
      }
      writeDraft(field.value);
    });

    updatePreview();
  }

  function progressSubmittedState() {
    if (document.body.dataset.state !== 'loading') return;
    var params = new URLSearchParams(window.location.search);
    if (!params.has('submitted')) return;
    window.setTimeout(function () {
      window.location.replace('success.html?submitted=1');
    }, 900);
  }

  injectProductNavigation();
  restoreDraft();
  wireReviewForm();
  progressSubmittedState();
}());
