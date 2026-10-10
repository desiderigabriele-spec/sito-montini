/* Comportamento del sito (HTML statico, niente React/Babel nel browser).
 * Conferma chiamate per Google Ads/Meta, zone, dissolvenze, contatore 40,
 * filtro servizi, carosello prima/dopo e foto ingrandibili. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Conferma chiamata reale ─────────────────────────────────
  // Un tap sul numero apre il dialer, ma spesso la persona annulla subito.
  // Se la pagina resta nascosta almeno 15 secondi consideriamo la chiamata
  // avvenuta e mandiamo 'chiamata_confermata' a GTM (e Contact a Meta).
  var MIN_CALL_MS = 15000, telClickAt = null;
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a[href^="tel:"]')) telClickAt = Date.now();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || telClickAt === null) return;
    var elapsed = Date.now() - telClickAt;
    telClickAt = null;
    if (elapsed >= MIN_CALL_MS) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'chiamata_confermata', durata_fuori_ms: elapsed });
      if (window.lmTrack) window.lmTrack('Contact', { method: 'phone' });
    }
  });

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    // Anno nel footer
    var y = document.querySelectorAll('[data-year]');
    for (var i = 0; i < y.length; i++) y[i].textContent = new Date().getFullYear();

    // ── Zone (hero) ───────────────────────────────────────────
    var zt = document.querySelector('[data-zone-toggle]'), zl = document.querySelector('[data-zone-list]');
    var zlab = document.querySelector('[data-zone-label]'), zch = document.querySelector('[data-zone-chevron]');
    if (zt && zl) {
      var zOpen = false;
      zt.setAttribute('aria-expanded', 'false');
      zt.addEventListener('click', function () {
        zOpen = !zOpen;
        zl.style.display = zOpen ? 'block' : 'none';
        zt.setAttribute('aria-expanded', String(zOpen));
        if (zch) zch.style.transform = zOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        if (zlab) zlab.textContent = zOpen ? 'Nascondi zone' : 'Vedi zone coperte';
      });
    }

    // ── Dissolvenza delle sezioni mentre si scorre ────────────
    if ('IntersectionObserver' in window && !reduce) {
      var fadeObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.style.opacity = '1';
          en.target.style.transform = 'none';
          fadeObs.unobserve(en.target);
        });
      }, { threshold: 0.07, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('section[data-screen-label] > div').forEach(function (el) {
        var label = el.parentNode.getAttribute('data-screen-label');
        if (label === 'Hero' || label === 'Trust strip') return;
        if (el.getBoundingClientRect().top >= window.innerHeight * 0.88) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(22px)';
          el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          fadeObs.observe(el);
        }
      });
    }

    // ── Contatore 0 → 40 ──────────────────────────────────────
    var ctr = document.querySelector('[data-counter]');
    if (ctr && 'IntersectionObserver' in window && !reduce && ctr.getBoundingClientRect().top > window.innerHeight) {
      var tens = ctr.querySelector('[data-c-tens]'), units = ctr.querySelector('[data-c-units]');
      tens.textContent = '0'; units.textContent = '0';
      var cObs = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        cObs.disconnect();
        var v = 0, t = setInterval(function () {
          v++;
          tens.textContent = Math.floor(v / 10); units.textContent = v % 10;
          if (v >= 40) clearInterval(t);
        }, 30);
      }, { threshold: 0.5 });
      cObs.observe(ctr);
    }

    // ── Servizi: filtro Tutti / Riparazioni / Lavori completi ──
    var tabs = document.querySelectorAll('[data-srv-filter]'), items = document.querySelectorAll('.srv-item');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener('click', function () {
        var f = this.getAttribute('data-srv-filter');
        for (var k = 0; k < tabs.length; k++) tabs[k].setAttribute('aria-pressed', tabs[k] === this ? 'true' : 'false');
        for (var j = 0; j < items.length; j++) {
          var cats = (items[j].getAttribute('data-cat') || '').split(' ');
          items[j].hidden = !(f === 'all' || cats.indexOf(f) !== -1);
        }
      });
    }

    // ── Prima / dopo: frecce, contatore, ciclico ──────────────
    var wrap = document.getElementById('pd-carousel-wrapper');
    var cards = wrap ? wrap.querySelectorAll('.pd-card') : [];
    var count = document.querySelector('[data-pd-count]');
    function step() { return cards.length ? cards[0].offsetWidth + 20 : 0; }
    function current() { return Math.round(wrap.scrollLeft / (step() || 1)); }
    function maxLeft() { return wrap.scrollWidth - wrap.clientWidth; }
    function updCount() {
      if (!count || !cards.length) return;
      var perView = Math.max(1, Math.round(wrap.clientWidth / step()));
      var first = Math.min(cards.length, current() + 1);
      var last = Math.min(cards.length, first + perView - 1);
      count.textContent = (perView > 1 ? 'Foto ' + first + '–' + last : 'Foto ' + first) + ' di ' + cards.length;
    }
    if (wrap && cards.length) {
      var prev = document.getElementById('pd-prev'), next = document.getElementById('pd-next');
      if (prev) prev.addEventListener('click', function () {
        if (wrap.scrollLeft <= 4) wrap.scrollTo({ left: maxLeft(), behavior: 'auto' });
        else wrap.scrollBy({ left: -step(), behavior: 'smooth' });
      });
      if (next) next.addEventListener('click', function () {
        if (wrap.scrollLeft >= maxLeft() - 4) wrap.scrollTo({ left: 0, behavior: 'auto' });
        else wrap.scrollBy({ left: step(), behavior: 'smooth' });
      });
      var st;
      wrap.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(updCount, 80); }, { passive: true });
      window.addEventListener('resize', updCount);
      updCount();
    }

    // ── Foto ingrandibili (lightbox) ──────────────────────────
    var lb, lbImg, lbCap, idx = 0, lastFocus;
    function buildLb() {
      lb = document.createElement('div');
      lb.className = 'lb';
      lb.hidden = true;
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Foto ingrandita');
      lb.innerHTML =
        '<button type="button" class="lb-btn lb-close" aria-label="Chiudi"><span>Chiudi</span><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Foto precedente"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
        '<img alt="">' +
        '<p class="lb-cap"></p>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Foto successiva"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>';
      document.body.appendChild(lb);
      lbImg = lb.querySelector('img'); lbCap = lb.querySelector('.lb-cap');
      lb.querySelector('.lb-close').addEventListener('click', closeLb);
      lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
      lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
      // scorrimento col dito
      var x0 = null;
      lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      });
      document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') closeLb();
        else if (e.key === 'ArrowRight') show(idx + 1);
        else if (e.key === 'ArrowLeft') show(idx - 1);
      });
    }
    function show(i) {
      idx = (i + cards.length) % cards.length;
      var c = cards[idx], img = c.querySelector('img'), ps = c.querySelectorAll('p');
      lbImg.src = img.getAttribute('src');
      lbImg.alt = img.getAttribute('alt') || '';
      lbCap.innerHTML = '';
      lbCap.textContent = ps[0] ? ps[0].textContent : '';
      if (ps[1]) { var sm = document.createElement('small'); sm.textContent = ps[1].textContent + ' · ' + (idx + 1) + ' di ' + cards.length; lbCap.appendChild(sm); }
    }
    function openLb(i) {
      if (!lb) buildLb();
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function closeLb() {
      lb.hidden = true;
      document.documentElement.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    Array.prototype.forEach.call(cards, function (c, i) {
      c.addEventListener('click', function () { openLb(i); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
    });

    var hasIO = 'IntersectionObserver' in window;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function onVisible(els, opts, fn) {
      if (!hasIO || reduce) { Array.prototype.forEach.call(els, function (el, i) { fn(el, i, true); }); return; }
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target, 0, false); } });
      }, opts);
      Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    }

    // ── Servizi: su computer tutti aperti, su telefono si aprono al tocco ──
    var srvItems = document.querySelectorAll('details.srv-item');
    var wide = window.matchMedia('(min-width: 900px)');
    function srvLayout() { Array.prototype.forEach.call(srvItems, function (d) { if (wide.matches) d.open = true; }); }
    srvLayout();
    if (wide.addEventListener) wide.addEventListener('change', srvLayout);
    Array.prototype.forEach.call(srvItems, function (d) {
      d.querySelector('summary').addEventListener('click', function (e) { if (wide.matches) e.preventDefault(); });
    });

    // ── Numeri che si riempiono (4,9 e 40) ───────────────────
    onVisible(document.querySelectorAll('[data-count-to]'), { threshold: 0.6 }, function (el, i, instant) {
      var to = parseFloat(el.getAttribute('data-count-to')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      function fmt(v) { return v.toFixed(dec).replace('.', ','); }
      if (instant) { el.textContent = fmt(to); return; }
      var t0 = null, dur = 1200;
      el.textContent = fmt(0);
      function tick(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(to * e);
        if (k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    // ── Prima/dopo: la tendina scopre il DOPO ─────────────────
    onVisible(document.querySelectorAll('.pd-card'), { threshold: 0.6 }, function (el, i, instant) {
      if (instant) el.classList.add('revealed');
      else setTimeout(function () { el.classList.add('revealed'); }, 350);
    });

    // ── Come lavoro: linea e passi in sequenza ────────────────
    onVisible(document.querySelectorAll('[data-steps]'), { threshold: 0.25 }, function (el) { el.classList.add('in'); });

    // ── Schede che entrano in prospettiva ─────────────────────
    if (hasIO && !reduce) {
      var cardsIn = document.querySelectorAll('.srv-item, .why-grid > div, .cert-grid > div, .g-rev');
      var below = Array.prototype.filter.call(cardsIn, function (c) { return c.getBoundingClientRect().top > window.innerHeight * 0.9; });
      below.forEach(function (c) {
        var sib = Array.prototype.indexOf.call(c.parentNode.children, c);
        c.classList.add('reveal3d');
        c.style.transitionDelay = (sib % 3) * 0.09 + 's';
      });
      onVisible(below, { threshold: 0.15 }, function (c) {
        c.classList.add('in');
        setTimeout(function () { c.style.transitionDelay = ''; }, 900);
      });
    }

    // ── Inclinazione 3D al passaggio del mouse (solo computer) ─
    if (finePointer && !reduce) {
      document.querySelectorAll('.srv-item, .why-grid > div, .cert-grid > div, .step, .g-rev, .trust-tile').forEach(function (el) {
        el.classList.add('tilt');
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = 'perspective(900px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 7).toFixed(2) + 'deg) translateY(-4px)';
          el.style.boxShadow = (-x * 14).toFixed(1) + 'px ' + (14 - y * 10).toFixed(1) + 'px 34px rgba(3,45,110,0.18)';
        });
        el.addEventListener('pointerleave', function () { el.style.transform = ''; el.style.boxShadow = ''; });
      });
      // Foto di Luigi che segue il mouse
      var hero = document.querySelector('section[data-screen-label="Hero"]'), photo = document.querySelector('[data-tilt-photo]');
      if (hero && photo) {
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          photo.style.transform = 'rotateY(' + (x * 12).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateZ(0)';
        });
        hero.addEventListener('pointerleave', function () { photo.style.transform = ''; });
      }
    }

    // ── Protezione foto (niente menu "salva immagine") ────────
    document.addEventListener('contextmenu', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); }, true);
    document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG') e.preventDefault(); }, true);
  });
})();
