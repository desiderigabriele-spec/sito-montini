/**
 * Richieste dal sito luigi-idraulico.it  →  Google Fogli + Telegram (+ email di ripiego).
 * Va incollato in Estensioni → Apps Script del foglio "Richieste".
 *
 * Proprietà dello script (Impostazioni progetto → Proprietà script):
 *   BOT_TOKEN  token del bot (da @BotFather)
 *   CHAT_ID    id della chat o del gruppo di Luigi
 *   EMAIL      (facoltativo) email dove ricevere la copia se Telegram non funziona
 */
var COLONNE = ['Data e ora', 'Provenienza', 'Categoria', 'Urgenza / Tempi', 'Problema', 'Tipo immobile', 'Nome', 'Cognome', 'Telefono', 'Email',
  'Comune', 'Indirizzo', 'Posizione GPS', 'Tipo di richiesta', 'Quando contattare', 'Messaggio', 'Stato', 'Note di Luigi'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.botcheck) return out_({ success: true }); // bot: finto ok
    var nome = cut_(d.nome, 60), tel = cut_(d.telefono, 30), comune = cut_(d.comune, 60);
    if (!nome || String(tel).replace(/\D/g, '').length < 6 || !comune) return out_({ success: false, error: 'dati' });
    if (!rateOk_()) return out_({ success: false, error: 'limite' });

    var gps = (d.lat && d.lon) ? 'https://www.google.com/maps?q=' + Number(d.lat).toFixed(5) + ',' + Number(d.lon).toFixed(5) : '';
    var riga = {
      prov: d.source === 'popup' ? 'Popup' : 'Modulo Contatti',
      cat: d.categoria === 'progetto' ? 'Lavoro da realizzare' : 'Da riparare',
      urg: cut_(d.urgenza, 60), prob: cut_(d.tipo, 80), imm: cut_(d.immobile, 40), nome: nome, cognome: cut_(d.cognome, 60), tel: tel,
      email: cut_(d.email, 100), comune: comune, via: cut_(d.indirizzo, 120), gps: gps,
      canale: tipo_(cut_(d.canale, 20))[0], fascia: cut_(d.fascia, 40), msg: cut_(d.messaggio, 1000)
    };

    var sh = sheet_();
    sh.appendRow([new Date(), riga.prov, riga.cat, riga.urg, riga.prob, riga.imm, riga.nome, riga.cognome, riga.tel, riga.email,
      riga.comune, riga.via, riga.gps, riga.canale, riga.fascia, riga.msg, 'Da richiamare', '']);

    var tg = telegram_(riga);
    if (!tg) mail_(riga);
    return out_({ success: true, telegram: tg });
  } catch (err) {
    return out_({ success: false, error: String(err) });
  }
}

function doGet() { return out_({ ok: true }); }

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
// Come vuole essere contattato: etichetta + icona per Telegram
function tipo_(c) {
  var m = { 'Email': ['Scrivi mail', '✉️'], 'WhatsApp': ['Messaggio', '💬'], 'Chiamata': ['Chiamata', '📞'] }[c];
  return m || [c || '-', '📩'];
}
function cut_(s, n) { return String(s == null ? '' : s).trim().slice(0, n); }
function esc_(s) { return String(s || '').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

// max 20 richieste ogni 10 minuti in totale (anti-spam)
function rateOk_() {
  var c = CacheService.getScriptCache(), n = Number(c.get('n') || 0);
  if (n >= 20) return false;
  c.put('n', String(n + 1), 600);
  return true;
}

function sheet_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Richieste') || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLONNE);
    sh.getRange(1, 1, 1, COLONNE.length).setFontWeight('bold').setBackground('#032D6E').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
    sh.getRange('I:I').setNumberFormat('@'); // telefono come testo
  }
  return sh;
}

function tipoTg_(label) {
  var icon = { 'Scrivi mail': '✉️', 'Messaggio': '💬', 'Chiamata': '📞' }[label] || '📩';
  return icon + ' <b>TIPO: ' + esc_(String(label || '-').toUpperCase()) + '</b>';
}

function waNum_(tel) {
  var d = String(tel).replace(/[^\d+]/g, '');
  if (d.charAt(0) === '+') return d.slice(1);
  if (d.slice(0, 2) === '00') return d.slice(2);
  return d.slice(0, 2) === '39' ? d : '39' + d;
}

function telegram_(r) {
  var p = PropertiesService.getScriptProperties(), token = p.getProperty('BOT_TOKEN'), chat = p.getProperty('CHAT_ID');
  if (!token || !chat) return false;
  var urgente = /emergenza/i.test(r.urg);
  var t = [
    urgente ? '🚨🚨 <b>URGENTE — nuova richiesta dal sito</b>' : (r.cat === 'Lavoro da realizzare' ? '🏗️ <b>Nuova richiesta di preventivo — lavoro da realizzare</b>' : '🔔 <b>Nuova richiesta dal sito</b>'),
    tipoTg_(r.canale), '',
    '👤 <b>' + esc_(r.nome + ' ' + r.cognome) + '</b>',
    '📞 ' + esc_(r.tel),
    '📍 <b>' + esc_(r.comune) + '</b>' + (r.via ? ', ' + esc_(r.via) : '')
  ];
  if (r.gps) t.push('🗺️ <a href="' + r.gps + '">Posizione sulla mappa</a>');
  if (r.email) t.push('✉️ ' + esc_(r.email));
  t.push('', '🔧 ' + esc_(r.prob || '-') + ' · ' + esc_(r.urg || '-'));
  if (r.imm) t.push('🏠 Immobile: ' + esc_(r.imm));
  if (r.fascia) t.push('🕐 Quando: ' + esc_(r.fascia));
  if (r.msg) t.push('', esc_(r.msg));
  t.push('', '<i>' + esc_(r.prov) + '</i>');
  try {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        chat_id: chat, text: t.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: '💬 Scrivigli su WhatsApp', url: 'https://wa.me/' + waNum_(r.tel) }]] }
      })
    });
    return res.getResponseCode() === 200;
  } catch (e) { return false; }
}

function mail_(r) {
  var to = PropertiesService.getScriptProperties().getProperty('EMAIL');
  if (!to) return;
  MailApp.sendEmail(to, 'Richiesta dal sito: ' + r.nome + ' ' + r.cognome + ' (' + r.comune + ')',
    [r.nome + ' ' + r.cognome, r.tel, r.comune + ' ' + r.via, r.gps, r.prob + ' · ' + r.urg, 'Tipo di richiesta: ' + r.canale, r.msg].join('\n'));
}

// Facoltativo: lancia questa funzione una volta per verificare il collegamento con Telegram.
function prova() {
  Logger.log(telegram_({ prov: 'Prova', cat: 'Lavoro da realizzare', imm: 'Appartamento', urg: 'Nei prossimi giorni', prob: 'Prova', nome: 'Prova', cognome: 'Test', tel: '333 0000000',
    email: '', comune: 'Sesto San Giovanni', via: '', gps: '', canale: 'Messaggio', fascia: 'Appena possibile', msg: 'Messaggio di prova' }));
}
