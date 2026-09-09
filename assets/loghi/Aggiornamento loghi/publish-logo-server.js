#!/usr/bin/env node
// Form locale per pubblicare (o aggiornare) un logo scaricato a mano: apri
// "Pubblica logo.bat" a doppio click, scegli il file PNG scaricato in
// questa stessa cartella, scrivi il nome del brand e premi "Pubblica" -
// lo script sposta il file in assets/loghi/, stima il colore, aggiorna
// assets/brands.json e fa commit + push su main, tutto in un solo
// passaggio. Se il brand esiste già, aggiorna il logo al posto di
// rifiutare. Segue lo standard descritto in assets/loghi/README.md.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

// Lo script vive dentro assets/loghi/Aggiornamento loghi/ (per averlo a
// portata di mano insieme ai PNG scaricati): risale alla radice del repo
// via git invece di un percorso relativo fisso, così funziona
// indipendentemente da dove si trova questo file.
const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: __dirname,
  encoding: 'utf8',
}).trim();
const ASSETS_DIR = path.join(REPO_ROOT, 'assets');
const LOGHI_DIR = path.join(ASSETS_DIR, 'loghi');
const STAGING_DIR = __dirname;
const BRANDS_FILE = path.join(ASSETS_DIR, 'brands.json');
const MAX_SIDE = 1000;
const PORT = 4545;

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Colore dominante escludendo bianco/nero/grigio e pixel trasparenti, con
// un peso maggiore ai pixel più saturi (i colori "di marca" tipicamente lo
// sono, a differenza dello sfondo o del testo nero/bianco).
async function estimateDominantColor(buffer) {
  const { data, info } = await sharp(buffer)
    .resize(32, 32, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 80) continue;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const isNearWhite = min > 225;
    const isNearBlackOrGray = max < 40 || max - min < 18;
    if (isNearWhite || isNearBlackOrGray) continue;

    const key = `${Math.round(r / 16)},${Math.round(g / 16)},${Math.round(b / 16)}`;
    const sat = (max - min) / 255;
    const weight = 1 + sat * 3;
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, weight: 0 };
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    bucket.weight += weight;
    buckets.set(key, bucket);
  }

  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.weight > best.weight) best = bucket;
  }
  if (!best) return null;

  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(best.r / best.weight)}${toHex(best.g / best.weight)}${toHex(best.b / best.weight)}`.toUpperCase();
}

function listStagedPngs() {
  return fs
    .readdirSync(STAGING_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderForm(message) {
  const files = listStagedPngs();
  const options = files.length
    ? files.map((f) => `<option value="${esc(f)}">${esc(f)}</option>`).join('')
    : '<option value="">(nessun PNG trovato in questa cartella)</option>';

  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<title>Pubblica logo FideliCard</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 560px; margin: 40px auto; color: #222; }
  h1 { font-size: 20px; }
  label { display: block; margin-top: 16px; font-weight: 600; font-size: 14px; }
  select, input { width: 100%; padding: 8px; margin-top: 4px; font-size: 14px; box-sizing: border-box; }
  button { margin-top: 24px; padding: 12px 20px; font-size: 15px; font-weight: 600; background: #FF9800; border: none; border-radius: 6px; cursor: pointer; }
  button:hover { background: #fb8c00; }
  .hint { color: #666; font-size: 12px; margin-top: 4px; }
  .msg { background: #eef; border-radius: 6px; padding: 12px; margin-bottom: 20px; white-space: pre-wrap; font-size: 13px; }
  .msg.error { background: #fee; }
  .msg.ok { background: #efe; }
</style></head>
<body>
  <h1>Pubblica un logo su FideliCard</h1>
  ${message ? `<div class="msg ${message.ok ? 'ok' : 'error'}">${esc(message.text)}</div>` : ''}
  <form method="POST" action="/publish">
    <label>File PNG scaricato (in questa cartella)
      <select name="filename" required>${options}</select>
    </label>
    <div class="hint"><a href="/">Aggiorna elenco</a> dopo aver scaricato un nuovo file qui dentro.</div>

    <label>Nome brand
      <input type="text" name="brand" placeholder="Es. Tigotà" required>
    </label>
    <div class="hint">Se il brand esiste già, il logo viene aggiornato invece di essere rifiutato come duplicato.</div>

    <label>Colore (opzionale - lascia vuoto per stimarlo dal logo)
      <input type="text" name="color" placeholder="#RRGGBB">
    </label>

    <label>Colore riquadro / boxColor (solo se il logo ha uno sfondo pieno cucito dentro, es. IKEA)
      <input type="text" name="boxColor" placeholder="#RRGGBB">
    </label>

    <label>Prefix EAN (opzionale)
      <input type="text" name="prefix" placeholder="Es. 8020">
    </label>

    <label>Dominio (opzionale)
      <input type="text" name="domain" placeholder="Es. tigota.it">
    </label>

    <button type="submit">Pubblica (commit + push)</button>
  </form>
</body></html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function git(args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
}

async function handlePublish(req, res) {
  const body = await readBody(req);
  const params = new URLSearchParams(body);
  const filename = (params.get('filename') || '').trim();
  const brand = (params.get('brand') || '').trim();
  const manualColor = (params.get('color') || '').trim();
  const boxColor = (params.get('boxColor') || '').trim();
  const prefix = (params.get('prefix') || '').trim();
  const domain = (params.get('domain') || '').trim();

  try {
    if (!filename) throw new Error('Scegli un file PNG dall\'elenco.');
    if (!brand) throw new Error('Scrivi il nome del brand.');

    const srcPath = path.join(STAGING_DIR, filename);
    if (!fs.existsSync(srcPath)) throw new Error(`Il file "${filename}" non esiste più in questa cartella.`);

    const slug = slugify(brand);
    if (!slug) throw new Error('Nome brand non valido.');
    const logoFile = `${slug}.png`;
    const destPath = path.join(LOGHI_DIR, logoFile);

    const brands = JSON.parse(fs.readFileSync(BRANDS_FILE, 'utf8'));
    const existingIndex = brands.findIndex((b) => b.logoFile === logoFile);
    const isUpdate = existingIndex !== -1;

    const resized = await sharp(srcPath)
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    fs.writeFileSync(destPath, resized);
    fs.unlinkSync(srcPath); // tolto da qui: ormai è in assets/loghi/

    let entry;
    if (isUpdate) {
      entry = brands[existingIndex];
      entry.brand = brand;
      if (manualColor) entry.color = manualColor; // altrimenti tiene il colore già curato
      if (prefix) entry.prefix = prefix;
      if (domain) entry.domain = domain;
      if (boxColor) entry.boxColor = boxColor;
    } else {
      const color = manualColor || (await estimateDominantColor(resized)) || '#1E1E1E';
      entry = { prefix, brand, logoFile, color };
      if (domain) entry.domain = domain;
      if (boxColor) entry.boxColor = boxColor;
      brands.push(entry);
    }

    fs.writeFileSync(BRANDS_FILE, JSON.stringify(brands, null, 2) + '\n');

    const commitMessage = isUpdate ? `Aggiorna il logo di ${brand}` : `Aggiunge il brand ${brand}`;
    git(['add', 'assets/brands.json', path.relative(REPO_ROOT, destPath)]);
    git(['commit', '-m', commitMessage]);
    const pushOutput = git(['push', 'origin', 'main']);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      renderForm({
        ok: true,
        text: `${isUpdate ? 'Logo aggiornato' : 'Brand pubblicato'} con successo: "${brand}"!\n\nEntry: ${JSON.stringify(entry)}\n\n${pushOutput || 'Push completato.'}`,
      })
    );
  } catch (err) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderForm({ ok: false, text: `Errore: ${err.message}` }));
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderForm(null));
  } else if (req.method === 'POST' && req.url === '/publish') {
    await handlePublish(req, res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Apri http://127.0.0.1:${PORT} nel browser per pubblicare un logo.`);
  console.log(`Cartella da cui scegliere i PNG: ${STAGING_DIR}`);
  try {
    execFileSync('cmd', ['/c', 'start', `http://127.0.0.1:${PORT}`]);
  } catch {
    // apertura automatica del browser non riuscita: va aperto a mano
  }
});
