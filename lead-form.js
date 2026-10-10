/* Invio richieste via Web3Forms (email all'indirizzo della chiave).
 * window.lmSendLead({name, phone, email, zona, message, source}) -> Promise<boolean>
 * Usato dal modulo nella sezione Contatti (form[data-lead-form]) e dal popup (lead-popup.js).
 * Dopo l'invio: evento dataLayer 'form_lead' (GTM/Ads/GA4) e, solo con consenso
 * Marketing, evento Lead a Meta con dati cifrati dal Pixel (associazione avanzata). */
(function () {
  'use strict';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var ACCESS_KEY = 'af9514cd-a1b2-43ba-af03-5cfccac636eb'; // chiave pubblica
  // Worker Cloudflare che inoltra la richiesta su Telegram (vedi worker/telegram-lead.js).
  // Vuoto = solo email. Se impostato: solo Telegram, con email Web3Forms come ripiego.
  var TELEGRAM_WORKER = '';

  function userData(name, phone, email) {
    var ud = {}, parts = name.toLowerCase().split(/\s+/).filter(Boolean);
    if (parts[0]) ud.fn = parts[0];
    if (parts.length > 1) ud.ln = parts.slice(1).join(' ');
    var d = phone.replace(/[^\d+]/g, '');
    if (d) {
      if (d.charAt(0) === '+') d = d.slice(1);
      else if (d.slice(0, 2) === '00') d = d.slice(2);
      else if (d.slice(0, 2) !== '39') d = '39' + d;
      ud.ph = d;
    }
    if (email) ud.em = email.toLowerCase();
    ud.country = 'it';
    return ud;
  }

  window.lmSendLead = function (d) {
    var name = (d.name || '').trim(), phone = (d.phone || '').trim(), email = (d.email || '').trim();
    var payload = {
      access_key: ACCESS_KEY,
      subject: 'Richiesta dal sito: ' + name,
      from_name: 'Sito luigi-idraulico.it',
      name: name, phone: phone, zona: (d.zona || '').trim(), message: (d.message || '').trim(),
      provenienza: d.source === 'popup' ? 'Popup di benvenuto' : 'Modulo Contatti',
      botcheck: ''
    };
    if (email) payload.email = email;
    function sendEmail() {
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (res) { return !!(res && res.success); })
        .catch(function () { return false; });
    }
    function sendTelegram() {
      return fetch(TELEGRAM_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone, email: email, zona: payload.zona,
          message: payload.message, source: d.source || 'form', botcheck: '' })
      }).then(function (r) { return r.json(); }).then(function (res) { return !!(res && res.success); })
        .catch(function () { return false; });
    }

    // Con il Worker attivo la richiesta va solo su Telegram; l'email parte
    // soltanto se Telegram non risponde (rete di sicurezza, niente doppioni).
    var sent = TELEGRAM_WORKER
      ? sendTelegram().then(function (ok) { return ok || sendEmail(); })
      : sendEmail();

    return sent.then(function (ok) {
      if (!ok) return false;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_lead', lead_source: d.source || 'form' });
      if (window.lmTrack) window.lmTrack('Lead', { method: d.source || 'form' }, userData(name, phone, email));
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

    btn.disabled = true;
    say('Invio in corso…', true);
    window.lmSendLead({
      name: v(f, 'name'), phone: v(f, 'phone'), email: v(f, 'email'),
      zona: v(f, 'zona'), message: v(f, 'message'), source: 'form'
    }).then(function (ok) {
      if (ok) { f.reset(); say('Grazie! Ho ricevuto la richiesta, ti richiamo appena possibile.', true); }
      else say('Non sono riuscito a inviare. Chiamami o scrivimi su WhatsApp.', false);
      btn.disabled = false;
    });
  });
})();
