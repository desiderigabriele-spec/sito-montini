/* Modulo "Ti richiamo io": invio via Web3Forms (email a info@luigi-idraulico.it).
 * Fuori dal runtime DC: submit gestito in delegazione su form[data-lead-form].
 * Dopo l'invio: evento dataLayer 'form_lead' (GTM/Ads/GA4) e, solo con consenso
 * Marketing, evento Lead a Meta con dati cifrati dal Pixel (associazione avanzata). */
(function () {
  'use strict';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var ACCESS_KEY = 'af9514cd-a1b2-43ba-af03-5cfccac636eb'; // chiave pubblica

  function v(f, n) { var el = f.elements[n]; return el ? String(el.value || '').trim() : ''; }

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

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.hasAttribute || !f.hasAttribute('data-lead-form')) return;
    e.preventDefault();
    var st = f.querySelector('[data-lead-status]');
    var btn = f.querySelector('button[type="submit"]');
    function say(msg, ok) { if (st) { st.textContent = msg; st.style.color = ok ? '#15803d' : '#b91c1c'; } }

    if (f.elements.botcheck && f.elements.botcheck.checked) return; // honeypot

    var name = v(f, 'name'), phone = v(f, 'phone'), email = v(f, 'email'),
        zona = v(f, 'zona'), message = v(f, 'message');
    var payload = {
      access_key: ACCESS_KEY,
      subject: 'Richiesta dal sito: ' + name,
      from_name: 'Sito luigi-idraulico.it',
      name: name, phone: phone, zona: zona, message: message, botcheck: ''
    };
    if (email) payload.email = email;

    btn.disabled = true;
    say('Invio in corso…', true);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.success) throw new Error('send');
      f.reset();
      say('Grazie! Ho ricevuto la richiesta, ti richiamo appena possibile.', true);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_lead' });
      if (window.lmTrack) window.lmTrack('Lead', { method: 'form' }, userData(name, phone, email));
    }).catch(function () {
      say('Non sono riuscito a inviare. Chiamami o scrivimi su WhatsApp.', false);
    }).then(function () { btn.disabled = false; });
  });
})();
