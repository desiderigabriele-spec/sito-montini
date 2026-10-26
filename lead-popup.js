/* Popup di benvenuto "Ti richiamo io": 4 passi (problema → urgenza → dove → contatti).
 * Vanilla JS fuori dal runtime DC. Compare dopo la splash e, al primo accesso,
 * dopo la scelta sul banner cookie (mai sovrapposto). Invio con window.lmSendLead.
 * Frequenza (localStorage lm_popup): chiuso → ricompare dopo 3 giorni; inviato → dopo 60. */
(function () {
  'use strict';
  var KEY = 'lm_popup';
  var DAY = 24 * 3600 * 1000;
  var PHONE = '366 436 6759';
  var TEL = 'tel:+393664366759';

  var REPAIR = [
    ['💧', 'Perdita d\'acqua'],
    ['🚽', 'Scarico o WC intasato'],
    ['🔥', 'Caldaia o riscaldamento guasti'],
    ['🚿', 'Rubinetti e sanitari']
  ];
  var PROJECTS = [
    ['🛁', 'Rifacimento bagno'],
    ['🏠', 'Nuovo impianto o ristrutturazione'],
    ['♨️', 'Nuova caldaia o pompa di calore'],
    ['❄️', 'Climatizzatore']
  ];
  var TIMING = [
    ['⚡', 'Il prima possibile', 'Ho già deciso, voglio partire presto', 'asap'],
    ['🗓️', 'Nei prossimi 1-3 mesi', 'Sto organizzando i lavori', 'soon3'],
    ['🧮', 'Sto valutando', 'Mi serve un preventivo per decidere', 'eval']
  ];
  var IMMOBILI = ['Appartamento', 'Casa indipendente', 'Ufficio o negozio', 'Condominio'];
  var COMUNI = ['Sesto San Giovanni', 'Cinisello Balsamo', 'Cologno Monzese', 'Monza', 'Bresso', 'Cusano Milanino',
    'Paderno Dugnano', 'Muggiò', 'Nova Milanese', 'Brugherio', 'Segrate', 'Milano'];
  var URGENCY = [
    ['🚨', 'È un\'emergenza', 'Acqua che esce, niente riscaldamento, scarico bloccato', 'urgent'],
    ['📅', 'Nei prossimi giorni', 'Il problema c\'è, ma può aspettare un attimo', 'soon'],
    ['💬', 'Mi serve un preventivo', 'Lavoro nuovo, sostituzione o ristrutturazione', 'quote']
  ];

  function suppressed() {
    try {
      if (sessionStorage.getItem(KEY)) return true;
      var s = JSON.parse(localStorage.getItem(KEY));
      return !!(s && s.until > Date.now());
    } catch (e) { return false; }
  }
  function suppress(days) {
    try {
      sessionStorage.setItem(KEY, '1');
      localStorage.setItem(KEY, JSON.stringify({ until: Date.now() + days * DAY }));
    } catch (e) {}
  }
  function track(ev, extra) {
    window.dataLayer = window.dataLayer || [];
    var o = { event: ev };
    for (var k in extra) o[k] = extra[k];
    window.dataLayer.push(o);
  }

  var css = '' +
    '#lm-pop{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Open Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b}' +
    '#lm-pop[hidden]{display:none}' +
    '#lm-pop *{box-sizing:border-box;margin:0}' +
    '#lm-pop .lp-bg{position:absolute;inset:0;background:rgba(1,24,72,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);animation:lp-fade .3s ease both}' +
    '#lm-pop .lp-card{position:relative;width:min(480px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#fff;border-radius:22px;box-shadow:0 30px 80px rgba(1,24,72,.45);animation:lp-in .42s cubic-bezier(.2,.9,.3,1.15) both;overscroll-behavior:contain}' +
    '#lm-pop .lp-head{position:relative;display:flex;align-items:center;gap:14px;padding:22px 56px 20px 22px;background:linear-gradient(135deg,#0d3e90 0%,#032D6E 60%,#011848 100%);color:#fff;border-radius:22px 22px 0 0}' +
    '#lm-pop .lp-av{position:relative;flex-shrink:0;width:62px;height:62px}' +
    '#lm-pop .lp-av img{width:62px;height:62px;border-radius:50%;border:3px solid #fff;display:block;object-fit:cover}' +
    '#lm-pop .lp-av i{position:absolute;right:-2px;bottom:-2px;width:24px;height:24px;border-radius:50%;background:#E43808;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;animation:lp-wave 1.6s ease-in-out .6s 2}' +
    '#lm-pop .lp-hi{font:700 21px/1.15 Oswald,"Open Sans",sans-serif;letter-spacing:.2px}' +
    '#lm-pop .lp-sub{font-size:13px;opacity:.85;margin-top:3px;line-height:1.4}' +
    '#lm-pop .lp-stars{color:#FBBF24;letter-spacing:1px}' +
    '#lm-pop .lp-x{position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:22px;line-height:1;cursor:pointer;transition:background .2s,transform .2s}' +
    '#lm-pop .lp-x:hover{background:rgba(255,255,255,.28);transform:rotate(90deg)}' +
    '#lm-pop .lp-prog{display:flex;gap:6px;padding:16px 22px 0}' +
    '#lm-pop .lp-prog span{flex:1;height:5px;border-radius:5px;background:#e2e8f0;overflow:hidden}' +
    '#lm-pop .lp-prog span b{display:block;height:100%;width:0;background:linear-gradient(90deg,#E43808,#ff7a45);border-radius:5px;transition:width .45s ease}' +
    '#lm-pop .lp-body{padding:18px 22px 22px}' +
    '#lm-pop .lp-step{animation:lp-step .38s ease both}' +
    '#lm-pop .lp-step[hidden]{display:none}' +
    '#lm-pop h2{font:700 25px/1.15 Oswald,"Open Sans",sans-serif;color:#032D6E}' +
    '#lm-pop .lp-p{font-size:15px;line-height:1.5;color:#475569;margin:8px 0 16px}' +
    '#lm-pop .lp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '#lm-pop .lp-chip{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:13px 12px;min-height:58px;border:1.5px solid #dbe3ef;border-radius:14px;background:#fff;color:#0f2a5c;font:600 14.5px/1.25 "Open Sans",system-ui,sans-serif;cursor:pointer;transition:border-color .18s,background .18s,transform .18s,box-shadow .18s}' +
    '#lm-pop .lp-chip:hover{border-color:#032D6E;background:#f3f7ff;transform:translateY(-2px);box-shadow:0 6px 18px rgba(3,45,110,.12)}' +
    '#lm-pop .lp-chip[aria-pressed="true"]{border-color:#032D6E;background:#e8f0ff;box-shadow:0 0 0 3px rgba(3,45,110,.12)}' +
    '#lm-pop .lp-chip em{font-style:normal;font-size:24px;line-height:1;flex-shrink:0}' +
    '#lm-pop .lp-chip small{display:block;font-weight:400;font-size:13px;color:#64748b;margin-top:2px}' +
    '#lm-pop .lp-list{display:flex;flex-direction:column;gap:10px}' +
    '#lm-pop .lp-list .lp-chip{padding:14px}' +
    '#lm-pop .lp-sos{margin-top:14px;padding:16px;border-radius:14px;background:#fff4ef;border:1.5px solid #fbd0c0;animation:lp-step .35s ease both}' +
    '#lm-pop .lp-sos p{font-size:14.5px;line-height:1.5;color:#7c2d12}' +
    '#lm-pop .lp-sos p+p{margin-top:6px;font-size:13.5px}' +
    '#lm-pop .lp-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:52px;margin-top:14px;padding:0 18px;border:0;border-radius:12px;background:#E43808;color:#fff;font:700 16.5px/1 "Open Sans",system-ui,sans-serif;text-decoration:none;cursor:pointer;box-shadow:0 6px 20px rgba(228,56,8,.32);transition:transform .15s,box-shadow .15s,filter .15s}' +
    '#lm-pop .lp-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 10px 26px rgba(228,56,8,.38)}' +
    '#lm-pop .lp-btn:disabled{opacity:.7;cursor:wait;transform:none}' +
    '#lm-pop .lp-btn.lp-ghost{background:#fff;color:#032D6E;border:2px solid #032D6E;box-shadow:none}' +
    '#lm-pop .lp-btn .lp-spin{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:lp-rot .7s linear infinite}' +
    '#lm-pop .lp-f{display:flex;flex-direction:column;gap:10px}' +
    '#lm-pop .lp-f input,#lm-pop .lp-f textarea{width:100%;padding:14px;border:1.5px solid #cbd5e1;border-radius:12px;background:#fff;color:#1e293b;font:16px/1.4 "Open Sans",system-ui,sans-serif;transition:border-color .18s,box-shadow .18s}' +
    '#lm-pop .lp-f input:focus,#lm-pop .lp-f textarea:focus{outline:0;border-color:#032D6E;box-shadow:0 0 0 4px rgba(3,45,110,.12)}' +
    '#lm-pop .lp-f textarea{resize:vertical;min-height:70px}' +
    '#lm-pop .lp-gl{font-size:12.5px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#E43808;margin:14px 0 8px}' +
    '#lm-pop .lp-gl:first-of-type{margin-top:0}' +
    '#lm-pop .lp-other{display:block;margin:8px auto 0}' +
    '#lm-pop .lp-seg.lp-seg2{grid-template-columns:1fr 1fr}' +
    '#lm-pop .lp-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '#lm-pop .lp-q{font-size:13.5px;font-weight:700;color:#032D6E;margin:6px 0 2px}' +
    '#lm-pop .lp-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
    '#lm-pop .lp-seg .lp-chip{min-height:48px;padding:10px 8px;justify-content:center;text-align:center;font-size:13.5px;gap:6px}' +
    '#lm-pop .lp-seg .lp-chip em{font-size:18px}' +
    '#lm-pop .lp-geo{font-size:13.5px;font-weight:600;color:#15803d}' +
    '#lm-pop .lp-hp{position:absolute!important;left:-9999px;width:1px;height:1px;opacity:0}' +
    '#lm-pop .lp-priv{font-size:12.5px;line-height:1.5;color:#64748b}' +
    '#lm-pop .lp-priv a{color:#032D6E;font-weight:600}' +
    '#lm-pop .lp-err{font-size:14px;font-weight:600;color:#b91c1c;margin-top:10px}' +
    '#lm-pop .lp-err a{color:#b91c1c}' +
    '#lm-pop .lp-nav{display:flex;justify-content:space-between;align-items:center;margin-top:14px}' +
    '#lm-pop .lp-link{border:0;background:none;padding:8px 0;color:#64748b;font:600 14px "Open Sans",system-ui,sans-serif;text-decoration:underline;cursor:pointer}' +
    '#lm-pop .lp-trust{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:16px;font-size:12.5px;color:#475569}' +
    '#lm-pop .lp-trust span::before{content:"✓ ";color:#16a34a;font-weight:700}' +
    '#lm-pop .lp-me{text-align:center;font-size:13px;color:#64748b;margin-top:10px}' +
    '#lm-pop .lp-ok{text-align:center;padding:6px 0 4px}' +
    '#lm-pop .lp-ok svg{width:84px;height:84px;display:block;margin:0 auto 12px}' +
    '#lm-pop .lp-ok circle{stroke:#16a34a;stroke-width:5;fill:#ecfdf3;stroke-dasharray:252;stroke-dashoffset:252;animation:lp-draw .6s ease forwards}' +
    '#lm-pop .lp-ok path{stroke:#16a34a;stroke-width:6;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;stroke-dashoffset:60;animation:lp-draw .35s ease .5s forwards}' +
    '#lm-pop .lp-ok .lp-p{margin-bottom:6px}' +
    '#lm-pop button:focus-visible,#lm-pop a:focus-visible{outline:3px solid #E43808;outline-offset:2px}' +
    '@keyframes lp-fade{from{opacity:0}}' +
    '@keyframes lp-in{from{opacity:0;transform:translateY(24px) scale(.96)}}' +
    '@keyframes lp-step{from{opacity:0;transform:translateX(18px)}}' +
    '@keyframes lp-rot{to{transform:rotate(360deg)}}' +
    '@keyframes lp-draw{to{stroke-dashoffset:0}}' +
    '@keyframes lp-wave{0%,100%{transform:rotate(0)}25%{transform:rotate(18deg)}75%{transform:rotate(-12deg)}}' +
    '@media(max-width:420px){#lm-pop .lp-seg .lp-chip em{display:none}#lm-pop .lp-two{grid-template-columns:1fr}}' +
    '@media(max-width:600px){' +
      '#lm-pop{align-items:flex-end;padding:0}' +
      '#lm-pop .lp-card{width:100%;max-height:92vh;max-height:92dvh;border-radius:22px 22px 0 0;padding-bottom:env(safe-area-inset-bottom);animation-name:lp-up}' +
      '#lm-pop .lp-head{padding:20px 56px 18px 18px}' +
      '#lm-pop .lp-body{padding:16px 18px 20px}' +
      '#lm-pop .lp-prog{padding:14px 18px 0}' +
      '#lm-pop h2{font-size:23px}' +
      '#lm-pop .lp-chip{font-size:14px;padding:12px 10px;gap:8px}' +
      '#lm-pop .lp-chip em{font-size:22px}' +
    '}' +
    '@keyframes lp-up{from{transform:translateY(100%)}}' +
    '@media(prefers-reduced-motion:reduce){#lm-pop *,#lm-pop .lp-card,#lm-pop .lp-bg{animation:none!important;transition:none!important}' +
      '#lm-pop .lp-ok circle,#lm-pop .lp-ok path{stroke-dashoffset:0}}';

  function chip(e, label, sub, val) {
    return '<button type="button" class="lp-chip" aria-pressed="false" data-val="' + (val || label) + '">' +
      '<em aria-hidden="true">' + e + '</em><span>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span></button>';
  }

  var root, lastFocus, state = { problem: '', kind: 'repair', immobile: '', urgency: '', urgencyKey: '', canale: 'WhatsApp', fascia: 'Appena possibile', lat: null, lon: null };

  function build() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'lm-pop';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'lp-t1');
    root.innerHTML =
      '<div class="lp-bg" data-close></div>' +
      '<div class="lp-card">' +
        '<div class="lp-head">' +
          '<div class="lp-av"><img src="luigi-avatar.webp" alt="Luigi, il tuo idraulico" width="62" height="62"><i aria-hidden="true">👋</i></div>' +
          '<div><p class="lp-hi">Ciao, sono Luigi</p>' +
          '<p class="lp-sub">Il tuo idraulico di fiducia da 40 anni<br><span class="lp-stars">★★★★★</span> 4,9 su Google</p></div>' +
          '<button type="button" class="lp-x" data-close aria-label="Chiudi">×</button>' +
        '</div>' +
        '<div class="lp-prog" aria-hidden="true"><span><b></b></span><span><b></b></span><span><b></b></span><span><b></b></span></div>' +
        '<div class="lp-body">' +

          '<section class="lp-step" data-step="1">' +
            '<h2 id="lp-t1">Come posso aiutarti?</h2>' +
            '<p class="lp-p">Che sia un guasto da sistemare o un lavoro da progettare, raccontamelo in due tocchi: poi ti contatto io, senza impegno.</p>' +
            '<p class="lp-gl">🔧 Qualcosa da riparare</p>' +
            '<div class="lp-grid" data-group="problem" data-kind="repair">' + REPAIR.map(function (p) { return chip(p[0], p[1]); }).join('') + '</div>' +
            '<p class="lp-gl">🏗️ Un lavoro da realizzare</p>' +
            '<div class="lp-grid" data-group="problem" data-kind="project">' + PROJECTS.map(function (p) { return chip(p[0], p[1]); }).join('') + '</div>' +
            '<button type="button" class="lp-link lp-other" data-other>Altro, non so come descriverlo</button>' +
            '<div class="lp-trust"><span>Senza impegno</span><span>Prezzo chiaro prima di iniziare</span></div>' +
            '<div class="lp-nav"><span></span><button type="button" class="lp-link" data-close>Non ora, do solo un\'occhiata</button></div>' +
          '</section>' +

          '<section class="lp-step" data-step="2" hidden>' +
            '<h2 data-s2-title>Quanto è urgente?</h2>' +
            '<p class="lp-p" data-s2-sub>Così so come organizzarmi per te.</p>' +
            '<div data-s2="repair">' +
              '<div class="lp-list" data-group="urgency">' + URGENCY.map(function (u) { return chip(u[0], u[1], u[2], u[3]); }).join('') + '</div>' +
              '<div class="lp-sos" data-sos hidden>' +
                '<p><b>Per un\'emergenza fai prima a chiamarmi:</b> se sono libero rispondo subito.</p>' +
                '<p>Intanto, se c\'è una perdita, chiudi il rubinetto generale dell\'acqua.</p>' +
                '<a class="lp-btn" href="' + TEL + '" data-sos-call>📞 Chiama ' + PHONE + '</a>' +
                '<button type="button" class="lp-btn lp-ghost" data-go="3">Preferisco lasciarti il numero</button>' +
              '</div>' +
            '</div>' +
            '<div data-s2="project" hidden>' +
              '<div class="lp-list" data-group="timing">' + TIMING.map(function (u) { return chip(u[0], u[1], u[2], u[3]); }).join('') + '</div>' +
            '</div>' +
            '<div class="lp-nav"><button type="button" class="lp-link" data-go="1">← Indietro</button><span></span></div>' +
          '</section>' +

          '<section class="lp-step" data-step="3" hidden>' +
            '<h2>Dove devo venire?</h2>' +
            '<p class="lp-p">Mi serve per organizzare l\'intervento o il sopralluogo e per prepararti un preventivo preciso.</p>' +
            '<div class="lp-f" data-where>' +
              '<input name="comune" list="lp-comuni" required autocomplete="address-level2" placeholder="Comune *" aria-label="Comune">' +
              '<datalist id="lp-comuni">' + COMUNI.map(function (c) { return '<option value="' + c + '">'; }).join('') + '</datalist>' +
              '<input name="indirizzo" autocomplete="street-address" placeholder="Via e numero civico (facoltativo)" aria-label="Indirizzo">' +
              '<button type="button" class="lp-btn lp-ghost" style="margin-top:2px" data-geo>📍 Usa la mia posizione</button>' +
              '<p class="lp-geo" data-geo-msg role="status" aria-live="polite" hidden></p>' +
              '<p class="lp-err" data-err3 role="alert" hidden></p>' +
              '<button type="button" class="lp-btn" data-next4>Avanti →</button>' +
            '</div>' +
            '<div class="lp-nav"><button type="button" class="lp-link" data-go="2">← Indietro</button><span></span></div>' +
          '</section>' +

          '<section class="lp-step" data-step="4" hidden>' +
            '<h2>Perfetto, ci penso io.</h2>' +
            '<p class="lp-p">Ultimo passo: come ti chiami e dove ti mando il preventivo? Poi ti contatto io.</p>' +
            '<form class="lp-f" data-pop-form novalidate>' +
              '<div class="lp-two"><input name="nome" required autocomplete="given-name" placeholder="Nome *" aria-label="Nome"><input name="cognome" required autocomplete="family-name" placeholder="Cognome *" aria-label="Cognome"></div>' +
              '<input name="phone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="Telefono *" aria-label="Numero di telefono">' +
              '<input name="email" type="email" autocomplete="email" placeholder="Email (facoltativa)" aria-label="Email">' +
              '<div data-immobile hidden>' +
                '<p class="lp-q" id="lp-q0">Che tipo di immobile è? (facoltativo)</p>' +
                '<div class="lp-seg lp-seg2" data-group="immobile" role="group" aria-labelledby="lp-q0">' + IMMOBILI.map(function (i) { return '<button type="button" class="lp-chip" aria-pressed="false" data-val="' + i + '"><span>' + i + '</span></button>'; }).join('') + '</div>' +
              '</div>' +
              '<p class="lp-q" id="lp-q1">Come preferisci ricevere il preventivo?</p>' +
              '<div class="lp-seg" data-group="canale" role="group" aria-labelledby="lp-q1">' +
                '<button type="button" class="lp-chip" aria-pressed="true" data-val="WhatsApp"><em aria-hidden="true">💬</em><span>WhatsApp</span></button>' +
                '<button type="button" class="lp-chip" aria-pressed="false" data-val="Chiamata"><em aria-hidden="true">📞</em><span>Chiamata</span></button>' +
                '<button type="button" class="lp-chip" aria-pressed="false" data-val="Email"><em aria-hidden="true">✉️</em><span>Email</span></button>' +
              '</div>' +
              '<p class="lp-q" id="lp-q2">Quando ti va bene essere contattato?</p>' +
              '<div class="lp-seg" data-group="fascia" role="group" aria-labelledby="lp-q2">' +
                '<button type="button" class="lp-chip" aria-pressed="true" data-val="Appena possibile"><span>Appena possibile</span></button>' +
                '<button type="button" class="lp-chip" aria-pressed="false" data-val="Mattina"><span>Mattina</span></button>' +
                '<button type="button" class="lp-chip" aria-pressed="false" data-val="Pomeriggio"><span>Pomeriggio</span></button>' +
              '</div>' +
              '<textarea name="note" rows="2" placeholder="Vuoi aggiungere qualcosa? (facoltativo)" aria-label="Note"></textarea>' +
              '<input class="lp-hp" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">' +
              '<p class="lp-priv">Uso i tuoi dati solo per contattarti. <a href="privacy.html" target="_blank" rel="noopener">Informativa privacy</a></p>' +
              '<button type="submit" class="lp-btn">Richiedi il preventivo 📩</button>' +
              '<p class="lp-err" data-err role="alert" hidden></p>' +
            '</form>' +
            '<p class="lp-me">Niente call center: ti contatto io, Luigi.</p>' +
            '<div class="lp-nav"><button type="button" class="lp-link" data-go="3">← Indietro</button><span></span></div>' +
          '</section>' +

          '<section class="lp-step lp-ok" data-step="5" hidden>' +
            '<svg viewBox="0 0 90 90" aria-hidden="true"><circle cx="45" cy="45" r="40"/><path d="M27 46 l12 12 l24 -26"/></svg>' +
            '<h2 data-ok-title tabindex="-1">Ricevuto! 🙌</h2>' +
            '<p class="lp-p" data-ok-msg>Ti contatto appena sono libero.</p>' +
            '<p class="lp-p">Se nel frattempo la situazione peggiora, chiamami pure al <a href="' + TEL + '" style="color:#032D6E;font-weight:700">' + PHONE + '</a>.</p>' +
            '<button type="button" class="lp-btn lp-ghost" data-close>Torna al sito</button>' +
          '</section>' +

        '</div>' +
      '</div>';
    document.body.appendChild(root);

    root.addEventListener('click', onClick);
    root.querySelector('[data-pop-form]').addEventListener('submit', onSubmit);
    root.querySelector('[data-pop-form]').addEventListener('input', function () { root.querySelector('[data-err]').hidden = true; });
    root.querySelector('[data-where]').addEventListener('input', function () { root.querySelector('[data-err3]').hidden = true; });
    root.addEventListener('keydown', onKey);
  }

  // Passo 2 e passo 4 si adattano: guasto da riparare o lavoro da realizzare
  function setKind(kind) {
    var proj = kind === 'project';
    var boxes = root.querySelectorAll('[data-s2]');
    for (var i = 0; i < boxes.length; i++) boxes[i].hidden = boxes[i].getAttribute('data-s2') !== kind;
    root.querySelector('[data-s2-title]').textContent = proj ? 'Quando vorresti iniziare?' : 'Quanto è urgente?';
    root.querySelector('[data-s2-sub]').textContent = proj ? 'Così organizzo il sopralluogo al momento giusto.' : 'Così so come organizzarmi per te.';
    root.querySelector('[data-immobile]').hidden = !proj;
    root.querySelector('[data-sos]').hidden = true;
  }

  function go(n) {
    var steps = root.querySelectorAll('[data-step]');
    for (var i = 0; i < steps.length; i++) steps[i].hidden = steps[i].getAttribute('data-step') !== String(n);
    var bars = root.querySelectorAll('.lp-prog b');
    for (var j = 0; j < bars.length; j++) bars[j].style.width = (j < Math.min(n, 4)) ? '100%' : '0';
    root.querySelector('.lp-prog').style.visibility = n === 5 ? 'hidden' : '';
    var cur = root.querySelector('[data-step="' + n + '"]');
    root.setAttribute('aria-labelledby', '');
    var h = cur.querySelector('h2');
    if (h) { if (!h.id) h.id = 'lp-t' + n; root.setAttribute('aria-labelledby', h.id); }
    var first = n === 3 ? cur.querySelector('input[name="comune"]') : n === 4 ? cur.querySelector('input[name="nome"]') : n === 5 ? cur.querySelector('[data-ok-title]') : cur.querySelector('.lp-chip[aria-pressed="true"]') || cur.querySelector('.lp-chip');
    if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 60);
    root.querySelector('.lp-card').scrollTop = 0;
  }

  function onClick(e) {
    var t = e.target;
    var c = t.closest('.lp-chip');
    if (c) {
      var group = c.parentNode.getAttribute('data-group');
      var all = c.parentNode.querySelectorAll('.lp-chip');
      if (group === 'immobile') {
        var was = c.getAttribute('aria-pressed') === 'true';
        for (var k = 0; k < all.length; k++) all[k].setAttribute('aria-pressed', 'false');
        state.immobile = was ? '' : c.getAttribute('data-val');
        if (!was) c.setAttribute('aria-pressed', 'true');
        return;
      }
      for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === c ? 'true' : 'false');
      var label = c.querySelector('span').firstChild.textContent;
      if (group === 'canale') { state.canale = c.getAttribute('data-val'); return; }
      if (group === 'fascia') { state.fascia = c.getAttribute('data-val'); return; }
      if (group === 'problem') {
        state.problem = label;
        state.kind = c.parentNode.getAttribute('data-kind') || 'repair';
        setKind(state.kind);
        setTimeout(function () { go(2); }, 260);
      } else if (group === 'timing') {
        state.urgency = label;
        state.urgencyKey = c.getAttribute('data-val');
        setTimeout(function () { go(3); }, 260);
      } else {
        state.urgency = label;
        state.urgencyKey = c.getAttribute('data-val');
        var sos = root.querySelector('[data-sos]');
        if (state.urgencyKey === 'urgent') sos.hidden = false;
        else { sos.hidden = true; setTimeout(function () { go(3); }, 260); }
      }
      return;
    }
    if (t.closest('[data-other]')) { state.problem = 'Altro'; state.kind = 'repair'; setKind('repair'); go(2); return; }
    if (t.closest('[data-geo]')) { geo(); return; }
    if (t.closest('[data-next4]')) { next4(); return; }
    var g = t.closest('[data-go]');
    if (g) { go(+g.getAttribute('data-go')); return; }
    if (t.closest('[data-sos-call]')) { track('popup_call_click', {}); return; }
    if (t.closest('[data-close]')) close(true);
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(true); return; }
    if (e.key !== 'Tab') return;
    // focus trap semplice
    var f = root.querySelectorAll('.lp-step:not([hidden]) button, .lp-step:not([hidden]) a, .lp-step:not([hidden]) input:not(.lp-hp), .lp-step:not([hidden]) textarea, .lp-x');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function geo() {
    var msg = root.querySelector('[data-geo-msg]'), btn = root.querySelector('[data-geo]');
    msg.hidden = false;
    if (!navigator.geolocation) { msg.style.color = '#b91c1c'; msg.textContent = 'Il tuo browser non permette di condividere la posizione: scrivi il comune qui sopra.'; return; }
    msg.style.color = '#475569'; msg.textContent = 'Un attimo…';
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (p) {
      state.lat = p.coords.latitude; state.lon = p.coords.longitude;
      msg.style.color = '#15803d'; msg.textContent = '✓ Posizione ricevuta. Scrivi comunque il comune qui sopra.';
      btn.disabled = false;
    }, function () {
      msg.style.color = '#b91c1c'; msg.textContent = 'Non riesco a leggere la posizione: nessun problema, scrivi il comune qui sopra.';
      btn.disabled = false;
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  function next4() {
    var w = root.querySelector('[data-where]'), err = root.querySelector('[data-err3]');
    var comune = w.querySelector('[name="comune"]');
    if (!comune.value.trim()) { err.textContent = 'Scrivimi il comune, così so se riesco ad arrivare in fretta.'; err.hidden = false; comune.focus(); return; }
    err.hidden = true;
    go(4);
  }

  function onSubmit(e) {
    e.preventDefault();
    var f = e.target, err = root.querySelector('[data-err]'), btn = f.querySelector('button[type="submit"]');
    if (f.elements.botcheck.checked) return;
    var nome = f.elements.nome.value.trim(), cognome = f.elements.cognome.value.trim(), phone = f.elements.phone.value.trim(), email = f.elements.email.value.trim();
    function bad(el, m) { el.focus(); err.textContent = m; err.hidden = false; }
    err.hidden = true;
    if (!nome) return bad(f.elements.nome, 'Scrivimi il tuo nome, così so chi contattare.');
    if (!cognome) return bad(f.elements.cognome, 'Mi serve anche il cognome per il preventivo.');
    if (phone.replace(/\D/g, '').length < 6) return bad(f.elements.phone, 'Controlla il numero di telefono: mi serve per contattarti.');
    if (state.canale === 'Email' && !/^\S+@\S+\.\S+$/.test(email)) return bad(f.elements.email, 'Per ricevere il preventivo via email mi serve la tua email.');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return bad(f.elements.email, 'Controlla l\'email: sembra incompleta.');

    var w = root.querySelector('[data-where]');
    btn.disabled = true;
    btn.innerHTML = '<span class="lp-spin" aria-hidden="true"></span> Invio…';
    window.lmSendLead({
      nome: nome, cognome: cognome, telefono: phone, email: email,
      comune: w.querySelector('[name="comune"]').value, indirizzo: w.querySelector('[name="indirizzo"]').value,
      lat: state.lat, lon: state.lon,
      tipo: state.problem, urgenza: state.urgency, canale: state.canale, fascia: state.fascia,
      categoria: state.kind === 'project' ? 'progetto' : 'riparazione', immobile: state.kind === 'project' ? state.immobile : '',
      messaggio: f.elements.note.value, source: 'popup'
    }).then(function (ok) {
      btn.disabled = false;
      btn.innerHTML = 'Richiedi il preventivo 📩';
      if (!ok) {
        err.innerHTML = 'Ops, la richiesta non è partita. Riprova oppure chiamami al <a href="' + TEL + '">' + PHONE + '</a>.';
        err.hidden = false;
        return;
      }
      suppress(60);
      var how = { WhatsApp: 'Ti scrivo su WhatsApp', Chiamata: 'Ti chiamo', Email: 'Ti scrivo via email' }[state.canale] || 'Ti contatto';
      root.querySelector('[data-ok-title]').textContent = 'Ricevuto, ' + nome + '! 🙌';
      root.querySelector('[data-ok-msg]').textContent = how + (state.kind === 'project' ? ' appena sono libero per fissare il sopralluogo.' : ' appena sono libero: tieni il telefono a portata di mano.');
      go(5);
    });
  }

  function open(src) {
    if (!window.lmSendLead) return;
    if (!root) build();
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    go(1);
    track('popup_open', { popup_source: src === 'manual' ? 'manuale' : 'automatico' });
  }
  function close(user) {
    if (!root || root.hidden) return;
    root.hidden = true;
    document.documentElement.style.overflow = '';
    if (user && !(function () { try { return JSON.parse(localStorage.getItem(KEY)).until - Date.now() > 2 * DAY; } catch (e) { return false; } })()) suppress(1);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    track('popup_close', {});
  }

  window.lmPopup = { open: open, close: close };

  // Il popup NON compare più da solo: si apre solo quando il visitatore lo chiede,
  // dai pulsanti del sito ([data-open-popup]), dal link #preventivo o con ?popup.
  var SPLASH_MS = 1100;

  // Apertura su richiesta: pulsanti [data-open-popup], link #preventivo, ?popup
  function forced() { return /[?&]popup(=|&|$)/.test(location.search) || location.hash === '#preventivo'; }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('[data-open-popup], a[href="#preventivo"]');
    if (t) { e.preventDefault(); open('manual'); }
  });
  window.addEventListener('hashchange', function () { if (location.hash === '#preventivo') open('manual'); });

  function schedule() {
    if (forced() && !window.__lmNoAutoBanner) {
      setTimeout(function () {
        if (window.lmCookie && window.lmCookie.pending()) document.addEventListener('lm:cookie-closed', function () { setTimeout(function () { open('manual'); }, 500); }, { once: true });
        else open('manual');
      }, SPLASH_MS + 300);
      return;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();
