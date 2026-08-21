(function () {
  'use strict';

  var instanceCount = 0;
  var checkIcon = '<svg class="fsel-option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function textOf(option) { return (option.label || option.textContent || '').trim(); }
  function enabledOptions(select) { return Array.prototype.filter.call(select.options, function (option) { return !option.disabled && !option.parentElement.disabled; }); }

  function enhance(select) {
    if (select.dataset.customSelectReady === 'true') return;
    var host = select.closest('.fsel');
    if (!host) return;
    select.dataset.customSelectReady = 'true';
    instanceCount += 1;
    var id = select.id || 'fsel-native-' + instanceCount;
    if (!select.id) select.id = id;
    var listId = id + '-listbox';
    var externalLabel = document.querySelector('label[for="' + id.replace(/"/g, '\\"') + '"]');
    var fieldCap = select.closest('.field') && select.closest('.field').querySelector('.cap');
    var sourceLabel = select.getAttribute('aria-label') || (externalLabel && externalLabel.textContent.trim()) || (fieldCap && fieldCap.textContent.trim()) || 'Вибрати значення';

    /* .fsel historically used a wrapping label. Convert only after JS starts,
       so the no-JS fallback stays a valid native label/select pair. */
    if (host.tagName === 'LABEL') {
      var replacement = document.createElement('div');
      Array.prototype.slice.call(host.attributes).forEach(function (attribute) { replacement.setAttribute(attribute.name, attribute.value); });
      while (host.firstChild) replacement.appendChild(host.firstChild);
      host.parentNode.replaceChild(replacement, host);
      host = replacement;
    }
    host.classList.add('is-enhanced');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'fsel-button';
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', listId);
    button.setAttribute('aria-label', sourceLabel);
    button.innerHTML = '<span class="fsel-button__text"></span><span class="fsel-button__chevron" aria-hidden="true"></span>';
    host.appendChild(button);
    var buttonText = button.querySelector('.fsel-button__text');

    var listbox = document.createElement('ul');
    listbox.className = 'fsel-listbox';
    listbox.id = listId;
    listbox.setAttribute('role', 'listbox');
    listbox.setAttribute('aria-label', sourceLabel);
    listbox.hidden = true;
    document.body.appendChild(listbox);
    var activeIndex = -1;
    var typeahead = '';
    var typeaheadTimer = 0;

    function currentIndex() { return select.selectedIndex < 0 ? 0 : select.selectedIndex; }
    function updateButton() {
      var selected = select.options[currentIndex()];
      buttonText.textContent = selected ? textOf(selected) : '';
      button.disabled = select.disabled;
      host.classList.toggle('is-disabled', select.disabled);
    }
    function optionNodes() { return Array.prototype.slice.call(listbox.querySelectorAll('[role="option"]')); }
    function setActive(index, focus) {
      var options = optionNodes();
      if (!options.length) return;
      if (!options.some(function (node) { return !node.disabled; })) { activeIndex = -1; return; }
      index = Math.max(0, Math.min(index, options.length - 1));
      while (options[index].disabled) index += index < options.length - 1 ? 1 : -1;
      activeIndex = index;
      options.forEach(function (node, nodeIndex) { node.dataset.active = String(nodeIndex === activeIndex); });
      var active = options[activeIndex];
      if (active) {
        active.scrollIntoView({ block: 'nearest' });
        if (focus) active.focus({ preventScroll: true });
      }
    }
    function renderOptions() {
      listbox.innerHTML = '';
      Array.prototype.slice.call(select.children).forEach(function (child) {
        if (child.tagName === 'OPTGROUP') {
          var group = document.createElement('li');
          group.className = 'fsel-optgroup'; group.setAttribute('role', 'presentation'); group.textContent = child.label;
          listbox.appendChild(group);
        }
        var options = child.tagName === 'OPTGROUP' ? child.options : [child];
        Array.prototype.forEach.call(options, function (option) {
          if (option.tagName !== 'OPTION') return;
          var item = document.createElement('li');
          item.className = 'fsel-option'; item.setAttribute('role', 'option'); item.tabIndex = -1;
          item.dataset.optionIndex = String(option.index);
          item.disabled = option.disabled || (option.parentElement && option.parentElement.disabled);
          item.setAttribute('aria-disabled', String(item.disabled));
          item.setAttribute('aria-selected', String(option.index === currentIndex()));
          item.innerHTML = '<span>' + textOf(option).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>' + (option.index === currentIndex() ? checkIcon : '');
          listbox.appendChild(item);
        });
      });
    }
    function position() {
      if (listbox.hidden) return;
      var rect = button.getBoundingClientRect();
      var gap = 6;
      var bottomLimit = window.innerHeight;
      document.querySelectorAll('.tabbar').forEach(function (bar) {
        var barRect = bar.getBoundingClientRect();
        if (barRect.top > rect.bottom && barRect.top < bottomLimit) bottomLimit = barRect.top;
      });
      var maxBelow = bottomLimit - rect.bottom - gap;
      var maxAbove = rect.top - gap;
      listbox.style.maxHeight = '';
      var desiredHeight = listbox.scrollHeight;
      var upward = (maxBelow < desiredHeight && maxAbove > maxBelow) || (maxBelow < 176 && maxAbove > maxBelow);
      var available = Math.max(120, upward ? maxAbove : maxBelow);
      listbox.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)) + 'px';
      listbox.style.width = Math.min(rect.width, window.innerWidth - 16) + 'px';
      listbox.style.maxHeight = available + 'px';
      listbox.style.top = upward ? Math.max(8, rect.top - Math.min(listbox.scrollHeight, available) - gap) + 'px' : Math.min(bottomLimit - available, rect.bottom + gap) + 'px';
      listbox.dataset.side = upward ? 'top' : 'bottom';
    }
    function close(returnFocus) {
      if (listbox.hidden) return;
      listbox.hidden = true; button.setAttribute('aria-expanded', 'false');
      if (returnFocus) button.focus({ preventScroll: true });
    }
    function moveTab(reverse) {
      var focusable = Array.prototype.filter.call(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'), function (node) {
        return !node.disabled && node.offsetParent !== null && !node.closest('[aria-hidden="true"]');
      });
      var index = focusable.indexOf(button);
      var next = focusable[index + (reverse ? -1 : 1)];
      close(false);
      if (next) next.focus({ preventScroll: true });
    }
    function open(focusSelected) {
      if (button.disabled) return;
      renderOptions(); listbox.hidden = false; button.setAttribute('aria-expanded', 'true'); position();
      var selectedNode = listbox.querySelector('[data-option-index="' + currentIndex() + '"]');
      var nodes = optionNodes();
      setActive(Math.max(0, nodes.indexOf(selectedNode)), focusSelected);
    }
    function choose(index) {
      var option = select.options[index];
      if (!option || option.disabled || (option.parentElement && option.parentElement.disabled)) return;
      select.selectedIndex = index;
      updateButton(); renderOptions();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }
    function move(delta) {
      var options = optionNodes();
      if (!options.length || !options.some(function (node) { return !node.disabled; })) return;
      var next = activeIndex < 0 ? 0 : activeIndex;
      if (options[next].disabled) { setActive(next, false); next = activeIndex; }
      do { next = (next + delta + options.length) % options.length; } while (options[next].disabled && next !== activeIndex);
      setActive(next, true);
    }
    function handleTypeahead(key) {
      if (key.length !== 1 || /\s/.test(key)) return false;
      window.clearTimeout(typeaheadTimer); typeahead += key.toLocaleLowerCase('uk-UA');
      typeaheadTimer = window.setTimeout(function () { typeahead = ''; }, 650);
      var options = optionNodes();
      var found = options.findIndex(function (node) { return !node.disabled && node.textContent.trim().toLocaleLowerCase('uk-UA').indexOf(typeahead) === 0; });
      if (found >= 0) setActive(found, true);
      return found >= 0;
    }

    button.addEventListener('click', function () { listbox.hidden ? open(true) : close(false); });
    button.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); if (listbox.hidden) open(false);
        var nodes = optionNodes();
        if (event.key === 'Home') setActive(0, true); else if (event.key === 'End') setActive(nodes.length - 1, true); else move(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); listbox.hidden ? open(true) : choose(Number(optionNodes()[activeIndex].dataset.optionIndex)); }
      else if (event.key === 'Escape') { close(false); }
      else if (event.key === 'Tab') { close(false); }
      else if (event.key.length === 1 && !/\s/.test(event.key)) { if (listbox.hidden) open(false); if (handleTypeahead(event.key)) event.preventDefault(); }
    });
    listbox.addEventListener('click', function (event) { var item = event.target.closest('[role="option"]'); if (item) choose(Number(item.dataset.optionIndex)); });
    listbox.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); move(event.key === 'ArrowDown' ? 1 : -1); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); setActive(event.key === 'Home' ? 0 : optionNodes().length - 1, true); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(Number(optionNodes()[activeIndex].dataset.optionIndex)); }
      else if (event.key === 'Escape') { event.preventDefault(); close(true); }
      else if (event.key === 'Tab') { event.preventDefault(); moveTab(event.shiftKey); }
      else { handleTypeahead(event.key); }
    });
    select.addEventListener('change', function () { updateButton(); if (!listbox.hidden) { renderOptions(); position(); } });
    new MutationObserver(function () { updateButton(); if (!listbox.hidden) { renderOptions(); position(); } }).observe(select, { attributes: true, childList: true, subtree: true });
    document.addEventListener('pointerdown', function (event) { if (!host.contains(event.target) && !listbox.contains(event.target)) close(false); }, true);
    window.addEventListener('resize', position); window.addEventListener('scroll', position, true);
    updateButton();
  }

  function ready() { document.querySelectorAll('.fsel > select').forEach(enhance); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
}());
