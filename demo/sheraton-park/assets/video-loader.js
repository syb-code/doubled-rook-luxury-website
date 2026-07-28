/* Sheraton Park demo — adaptive video loading.
   Picks the mobile or desktop encode per viewport, defers below-fold
   videos until they approach the viewport, and leaves the poster image
   in place for reduced-motion / Save-Data visitors. */
(function () {
  var conn = navigator.connection || {};
  if ((window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || conn.saveData) return;
  var mobile = window.matchMedia && window.matchMedia('(max-width: 740px)').matches;
  function load(v) {
    v.src = (mobile && v.getAttribute('data-src-mobile')) || v.getAttribute('data-src');
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  var eager = document.querySelectorAll('video[data-src]:not([data-lazy])');
  for (var i = 0; i < eager.length; i++) load(eager[i]);
  var lazy = document.querySelectorAll('video[data-src][data-lazy]');
  if (!lazy.length) return;
  if (!('IntersectionObserver' in window)) {
    for (var j = 0; j < lazy.length; j++) load(lazy[j]);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { load(en.target); io.unobserve(en.target); }
    });
  }, { rootMargin: '200px 0px' });
  for (var k = 0; k < lazy.length; k++) io.observe(lazy[k]);
})();
