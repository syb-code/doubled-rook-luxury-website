/* Sheraton Park demo — adaptive video loading.
   Serves the smaller mobile encode to narrow viewports, falls back to the
   desktop file if the mobile file fails to load, and defers below-fold
   videos until they approach the viewport. */
(function () {
  var mobile = window.matchMedia && window.matchMedia('(max-width: 740px)').matches;
  function load(v) {
    var desktop = v.getAttribute('data-src');
    var small = mobile && v.getAttribute('data-src-mobile');
    /* set as properties, not just attributes — iOS/Android require both
       for programmatic autoplay */
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    function attempt() {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    if (small && small !== desktop) {
      v.addEventListener('error', function () {
        v.src = desktop;
        v.load();
        attempt();
      }, { once: true });
    }
    v.addEventListener('canplay', function () { if (v.paused) attempt(); });
    v.src = small || desktop;
    attempt();
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
