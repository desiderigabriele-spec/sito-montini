/* Banner cookie + Google Consent Mode v2.
 * Vanilla JS, fuori dal runtime DC. Lo stato di default (tutto negato) è impostato
 * nello <script> inline in <head>, prima di GTM; qui si gestisce solo la scelta.
 * Chiave localStorage: lm_consent = { v, ts, analytics, marketing } */
(function () {
  'use strict';
  var KEY = 'lm_consent';
  var MAX_AGE = 180 * 24 * 3600 * 1000; // 6 mesi, poi si richiede di nuovo
  var POLICY = 'privacy.html';
  var PIXEL_ID = '1625986432269243';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && c.v === 1 && Date.now() - c.ts < MAX_AGE) return c;
    } catch (e) {}
    return null;
  }
  function write(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
  }
  // Meta Pixel: si carica SOLO con il consenso Marketing (niente <noscript>,
  // che partirebbe senza consenso). Eventi: PageView, Contact (chiamata/WhatsApp).
  var pixelOn = false;
  function loadPixel() {
    if (pixelOn) { if (window.fbq) window.fbq('consent', 'grant'); return; }
    pixelOn = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('set', 'autoConfig', false, PIXEL_ID);
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function revokePixel() { if (window.fbq) window.fbq('consent', 'revoke'); pixelOn = false; }
  // userData (opzionale): nome, telefono, email dal modulo. Con il consenso Marketing
  // il Pixel li cifra nel browser prima dell'invio (associazione avanzata manuale).
  window.lmTrack = function (name, params, userData) {
    var c = read();
    if (!(c && c.marketing && window.fbq)) return;
    if (userData) window.fbq('init', PIXEL_ID, userData);
    window.fbq('track', name, params || {});
  };

  function apply(c) {
    if (c.marketing) loadPixel(); else revokePixel();
    var a = c.analytics ? 'granted' : 'denied';
    var m = c.marketing ? 'granted' : 'denied';
    gtag('consent', 'update', {
      analytics_storage: a,
      ad_storage: m,
      ad_user_data: m,
      ad_personalization: m
    });
    window.dataLayer.push({ event: 'cookie_consent_update', consent_analytics: a, consent_marketing: m });
  }
  function save(analytics, marketing) {
    var c = { v: 1, ts: Date.now(), analytics: !!analytics, marketing: !!marketing };
    write(c);
    apply(c);
    close();
  }

  var css = '' +
    '#lm-cc{position:fixed;left:20px;bottom:20px;z-index:9000;width:min(440px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:#fff;color:#1e293b;border-radius:16px;box-shadow:0 12px 48px rgba(1,24,72,.35),0 0 0 1px rgba(3,45,110,.08);font:14px/1.5 "Open Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px}' +
    '#lm-cc *{box-sizing:border-box}' +
    '#lm-cc h2{font:700 18px/1.2 Oswald,"Open Sans",sans-serif;color:#032D6E;margin:0 0 8px}' +
    '#lm-cc p{margin:0 0 14px;color:#475569}' +
    '#lm-cc a{color:#032D6E;font-weight:600;text-decoration:underline}' +
    '#lm-cc .lm-row{display:flex;gap:10px}' +
    '#lm-cc button{font:700 14px/1 "Open Sans",system-ui,sans-serif;cursor:pointer;border-radius:10px;min-height:44px;padding:0 14px;border:2px solid #032D6E;background:#fff;color:#032D6E}' +
    '#lm-cc .lm-row button{flex:1}' +
    '#lm-cc .lm-row button.lm-yes{flex:1.35;background:#16a34a;border-color:#16a34a;color:#fff;box-shadow:0 6px 18px rgba(22,163,74,.35);font-size:15px}' +
    '#lm-cc .lm-row button.lm-yes:hover{background:#15803d;border-color:#15803d}' +
    '#lm-cc .lm-row button.lm-no{background:#fff;border-color:#cbd5e1;color:#334155}' +
    '#lm-cc .lm-row button.lm-no:hover{border-color:#94a3b8;background:#f8fafc}' +
    '#lm-cc .lm-luigi{display:flex;align-items:center;gap:12px;margin-bottom:10px}' +
    '#lm-cc .lm-luigi img{width:46px;height:46px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 2px #032D6E;object-fit:cover;flex-shrink:0}' +
    '#lm-cc .lm-luigi h2{margin:0}' +
    '#lm-cc button:focus-visible{outline:3px solid #E43808;outline-offset:2px}' +
    '#lm-cc .lm-link{display:block;width:100%;margin-top:8px;border:0;background:none;color:#475569;text-decoration:underline;font-weight:600;min-height:40px}' +
    '#lm-cc .lm-opt{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid #e2e8f0}' +
    '#lm-cc .lm-opt input{width:20px;height:20px;margin-top:2px;accent-color:#032D6E;flex-shrink:0}' +
    '#lm-cc .lm-opt b{display:block;color:#032D6E}' +
    '#lm-cc .lm-opt span{color:#64748b;font-size:13px}' +
    '#lm-cc [hidden]{display:none!important}' +
    '@media(max-width:600px){#lm-cc{left:8px;right:8px;bottom:8px;width:auto;padding:16px}}';

  var root;
  function build() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'lm-cc';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Preferenze cookie');
    root.hidden = true;
    root.innerHTML =
      '<div data-v="main">' +
        '<div class="lm-luigi"><img src="luigi-avatar.webp" alt="Luigi" width="46" height="46"><h2>Ciao, sono Luigi 👋</h2></div>' +
        '<p>Uso i cookie di Google e di Facebook per capire quante persone visitano il sito e se le mie pubblicità servono davvero. Così non butto soldi in annunci inutili. Non li uso per altro e non vendo i tuoi dati a nessuno. Se accetti mi dai una bella mano; se non vuoi, il sito funziona uguale. <a href="' + POLICY + '">Maggiori informazioni</a></p>' +
        '<div class="lm-row"><button type="button" class="lm-no" data-a="reject">No, grazie</button><button type="button" class="lm-yes" data-a="accept">✓ Va bene, accetto</button></div>' +
        '<button type="button" class="lm-link" data-a="custom">Scegli cosa accettare</button>' +
      '</div>' +
      '<div data-v="custom" hidden>' +
        '<h2>Scegli cosa accettare</h2>' +
        '<div class="lm-opt"><input type="checkbox" checked disabled id="lm-n"><label for="lm-n"><b>Necessari</b><span>Servono al sito per funzionare e a ricordare la tua scelta. Sono sempre attivi.</span></label></div>' +
        '<div class="lm-opt"><input type="checkbox" id="lm-an"><label for="lm-an"><b>Statistiche</b><span>Mi dicono quante persone visitano il sito e quali pagine guardano (Google Analytics).</span></label></div>' +
        '<div class="lm-opt"><input type="checkbox" id="lm-mk"><label for="lm-mk"><b>Marketing</b><span>Mi dicono se una mia pubblicità su Google o Facebook/Instagram ti ha portato a contattarmi.</span></label></div>' +
        '<div class="lm-row" style="margin-top:6px"><button type="button" class="lm-no" data-a="save">Salva scelte</button><button type="button" class="lm-yes" data-a="accept">✓ Accetto tutto</button></div>' +
      '</div>';
    document.body.appendChild(root);
    root.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (!a) return;
      if (a === 'accept') save(true, true);
      else if (a === 'reject') save(false, false);
      else if (a === 'save') save(root.querySelector('#lm-an').checked, root.querySelector('#lm-mk').checked);
      else if (a === 'custom') view('custom');
    });
  }
  function view(v) {
    var els = root.querySelectorAll('[data-v]');
    for (var i = 0; i < els.length; i++) els[i].hidden = els[i].getAttribute('data-v') !== v;
  }
  function open() {
    if (!root) build();
    var c = read();
    root.querySelector('#lm-an').checked = !!(c && c.analytics);
    root.querySelector('#lm-mk').checked = !!(c && c.marketing);
    view(c ? 'custom' : 'main');
    root.hidden = false;
  }
  function close() {
    if (!root || root.hidden) return;
    root.hidden = true;
    document.dispatchEvent(new Event('lm:cookie-closed'));
  }

  window.lmCookie = {
    open: open,
    // true se il banner è visibile o sta per comparire (primo accesso, nessuna scelta)
    pending: function () { return root ? !root.hidden : (!read() && !window.__lmNoAutoBanner); }
  };

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('[data-cookie-settings]');
    if (t) { e.preventDefault(); open(); }
  });

  // Click su WhatsApp -> evento Contact per Meta (la chiamata arriva da index.html)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) window.lmTrack('Contact', { method: 'whatsapp' });
  }, true);

  function init() {
    var c0 = read();
    if (c0 && c0.marketing) loadPixel();
    if (window.__lmNoAutoBanner) return;
    if (!read()) setTimeout(open, 3000); // dopo la splash (2.8s)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
