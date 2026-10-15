// Home "Aus Österreich" section, tablet (768-991px): the map's pin and "Austria" label
// landed on the heading, and the first card hid the label. Move the map down until the pin
// clears the heading, then push the cards below the label. Measured, so it holds at any
// root font size. Phones have their own version (HomeMobileSections); this only touches
// what it set itself. Lives in the Home page head custom code (runs on load).
(function () {
  var mq = window.matchMedia('(min-width: 768px) and (max-width: 991px)');
  var PIN_ABOVE_LABEL = 90; // the pin graphic sits up to ~90px above the label's top edge
  var set = false;

  function fit() {
    var g = document.querySelector('.greetings_sec');
    var inner = g && g.querySelector('.greetings_map_inner');
    var label = g && g.querySelector('.greetings_map_label');
    var head = g && g.querySelector('.greetings_head');
    var lay = g && g.querySelector('.greetings_layout');
    if (!inner || !label || !head || !lay) return;
    if (set) { inner.style.top = ''; head.style.marginBottom = ''; set = false; }
    if (!mq.matches) return;
    var shift = head.getBoundingClientRect().bottom + PIN_ABOVE_LABEL - label.getBoundingClientRect().top;
    if (shift > 0) inner.style.top = (parseFloat(getComputedStyle(inner).top) + shift) + 'px';
    var need = label.getBoundingClientRect().bottom + 32 - lay.getBoundingClientRect().top;
    if (need > 0) head.style.marginBottom = (parseFloat(getComputedStyle(head).marginBottom) + need) + 'px';
    set = shift > 0 || need > 0;
  }

  if (document.readyState === 'complete') fit(); else window.addEventListener('load', fit);
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 150); });
})();
