/* Invio richieste. Canale principale: Google Fogli + Telegram tramite Apps Script
 * (apps-script/Code.gs). Se non risponde parte l'email di ripiego (Web3Forms).
 * window.lmSendLead({...}) -> Promise<boolean>, usato dal modulo Contatti
 * (form[data-lead-form]) e dal popup (lead-popup.js).
 * Dopo l'invio: evento dataLayer 'form_lead' (GTM/Ads/GA4) e, solo con consenso
 * Marketing, evento Lead a Meta con dati cifrati dal Pixel (associazione avanzata). */
(function () {
  'use strict';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var ACCESS_KEY = 'af9514cd-a1b2-43ba-af03-5cfccac636eb'; // chiave pubblica
  // URL dell'app web Apps Script (Distribuisci → Applicazione web). Vuoto = solo email.
  var LEADS_URL = '';

  function userData(d) {
    var ud = {};
    if (d.nome) ud.fn = d.nome.toLowerCase();
    if (d.cognome) ud.ln = d.cognome.toLowerCase();
    var t = (d.telefono || '').replace(/[^\d+]/g, '');
    if (t) {
      if (t.charAt(0) === '+') t = t.slice(1);
      else if (t.slice(0, 2) === '00') t = t.slice(2);
      else if (t.slice(0, 2) !== '39') t = '39' + t;
      ud.ph = t;
    }
    if (d.email) ud.em = d.email.toLowerCase();
    if (d.comune) ud.ct = d.comune.toLowerCase().replace(/[^a-z]/g, '');
    ud.country = 'it';
    return ud;
  }

  function clean(d) {
    var o = {};
    ['nome', 'cognome', 'telefono', 'email', 'comune', 'indirizzo', 'tipo', 'urgenza', 'canale', 'fascia', 'messaggio', 'source', 'categoria', 'immobile'].forEach(function (k) {
      o[k] = String(d[k] == null ? '' : d[k]).trim();
    });
    if (d.lat && d.lon) { o.lat = d.lat; o.lon = d.lon; }
    return o;
  }

  function sendLeads(d) {
    // text/plain: richiesta "semplice", niente preflight CORS verso Apps Script
    return fetch(LEADS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(d)
    }).then(function (r) { return r.json(); }).then(function (res) { return !!(res && res.success); })
      .catch(function () { return false; });
  }

  function sendEmail(d) {
    var righe = [
      'Provenienza: ' + (d.source === 'popup' ? 'Popup' : 'Modulo Contatti'),
      'Categoria: ' + (d.categoria === 'progetto' ? 'Lavoro da realizzare' : 'Da riparare'),
      'Problema: ' + (d.tipo || '-'), 'Urgenza / tempi: ' + (d.urgenza || '-'),
      d.immobile ? 'Immobile: ' + d.immobile : '',
      'Comune: ' + d.comune + (d.indirizzo ? ' — ' + d.indirizzo : ''),
      d.lat ? 'Posizione: https://www.google.com/maps?q=' + Number(d.lat).toFixed(5) + ',' + Number(d.lon).toFixed(5) : '',
      'Preventivo via: ' + (d.canale || '-') + (d.fascia ? ' (' + d.fascia + ')' : ''),
      '', d.messaggio
    ].filter(function (x, i) { return x !== '' || i > 5; });
    var payload = {
      access_key: ACCESS_KEY,
      subject: 'Richiesta dal sito: ' + d.nome + ' ' + d.cognome + ' (' + d.comune + ')',
      from_name: 'Sito luigi-idraulico.it',
      name: d.nome + ' ' + d.cognome, phone: d.telefono, message: righe.join('\n'), botcheck: ''
    };
    if (d.email) payload.email = d.email;
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (res) { return !!(res && res.success); })
      .catch(function () { return false; });
  }

  window.lmSendLead = function (raw) {
    var d = clean(raw);
    var sent = LEADS_URL
      ? sendLeads(d).then(function (ok) { return ok || sendEmail(d); })
      : sendEmail(d);
    return sent.then(function (ok) {
      if (!ok) return false;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_lead', lead_source: d.source || 'form' });
      if (window.lmTrack) window.lmTrack('Lead', { method: d.source || 'form' }, userData(d));
      return true;
    });
  };

  function v(f, n) { var el = f.elements[n]; return el ? String(el.value || '').trim() : ''; }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.hasAttribute || !f.hasAttribute('data-lead-form')) return;
    e.preventDefault();
    var st = f.querySelector('[data-lead-status]');
    var btn = f.querySelector('button[type="submit"]');
    function say(msg, ok) { if (st) { st.textContent = msg; st.style.color = ok ? '#15803d' : '#b91c1c'; } }

    if (f.elements.botcheck && f.elements.botcheck.checked) return; // honeypot

    var canale = v(f, 'canale') || 'WhatsApp';
    if (canale === 'Email' && !v(f, 'email')) { say('Per ricevere il preventivo via email mi serve la tua email.', false); f.elements.email.focus(); return; }

    btn.disabled = true;
    say('Invio in corso…', true);
    window.lmSendLead({
      nome: v(f, 'nome'), cognome: v(f, 'cognome'), telefono: v(f, 'phone'), email: v(f, 'email'),
      comune: v(f, 'comune'), indirizzo: v(f, 'indirizzo'), canale: canale, messaggio: v(f, 'message'),
      tipo: 'Dal modulo Contatti', source: 'form'
    }).then(function (ok) {
      if (ok) { f.reset(); say('Grazie! Ho ricevuto la richiesta, ti contatto appena possibile.', true); }
      else say('Non sono riuscito a inviare. Chiamami o scrivimi su WhatsApp.', false);
      btn.disabled = false;
    });
  });
})();
