// Cloudflare Worker: riceve la richiesta dal sito e la manda su Telegram.
// Variabili da impostare su Cloudflare (Settings → Variables and Secrets):
//   BOT_TOKEN  (Secret)  token del bot, da @BotFather
//   CHAT_ID    (Text)    id della chat di Luigi (o del gruppo)
const ALLOWED = ['https://luigi-idraulico.it', 'https://www.luigi-idraulico.it'];

const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const cut = (s, n) => String(s || '').trim().slice(0, n);

function waNumber(phone) {
  let d = String(phone).replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (!d.startsWith('39')) d = '39' + d;
  return d;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const reply = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return reply({ success: false }, 405);
    if (!ALLOWED.includes(origin)) return reply({ success: false }, 403);

    let d;
    try {
      const raw = await req.text();
      if (raw.length > 5000) return reply({ success: false }, 413);
      d = JSON.parse(raw);
    } catch (e) { return reply({ success: false }, 400); }

    if (d.botcheck) return reply({ success: true }); // honeypot: finto ok ai bot
    const name = cut(d.name, 80), phone = cut(d.phone, 30);
    if (!name || phone.replace(/\D/g, '').length < 6) return reply({ success: false }, 422);

    const urgent = /emergenza/i.test(d.message || '');
    const lines = [
      urgent ? '🚨🚨 <b>URGENTE — nuova richiesta dal sito</b>' : '🔔 <b>Nuova richiesta dal sito</b>',
      '',
      '👤 <b>' + esc(name) + '</b>',
      '📞 ' + esc(phone),
    ];
    if (d.zona) lines.push('📍 ' + esc(cut(d.zona, 60)));
    if (d.email) lines.push('✉️ ' + esc(cut(d.email, 80)));
    if (d.message) lines.push('', esc(cut(d.message, 800)));
    lines.push('', '<i>' + (d.source === 'popup' ? 'Dal popup di benvenuto' : 'Dal modulo Contatti') + '</i>');

    const tg = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: '💬 Scrivigli su WhatsApp', url: 'https://wa.me/' + waNumber(phone) }]] },
      }),
    });
    return reply({ success: tg.ok }, tg.ok ? 200 : 502);
  },
};
