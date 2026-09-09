#!/usr/bin/env node
// Prepara una entry candidata per assets/brands.json a partire dal nome di
// un brand segnalato come "logo mancante" (vedi utils/missingLogoReport.ts):
// scarica un logo candidato (Clearbit, o il favicon di Google come ripiego
// di qualità peggiore) e stima un colore dominante, poi scrive tutto in
// assets/brands.draft.json per la revisione manuale - non tocca MAI
// brands.json direttamente. Segue lo standard descritto in
// assets/loghi/README.md.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { slugify, estimateDominantColor } = require('./logo-utils');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const LOGHI_DIR = path.join(ASSETS_DIR, 'loghi');
const DRAFT_FILE = path.join(ASSETS_DIR, 'brands.draft.json');
const MAX_SIDE = 1000;

async function tryFetchImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return null;
    await sharp(buf).metadata(); // valida che sia un'immagine leggibile
    return buf;
  } catch {
    return null;
  }
}

async function downloadCandidateLogo(domain) {
  if (!domain) return null;

  const clearbit = await tryFetchImage(`https://logo.clearbit.com/${domain}?size=512`);
  if (clearbit) return { buffer: clearbit, quality: 'clearbit' };

  const favicon = await tryFetchImage(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
  if (favicon) return { buffer: favicon, quality: 'favicon di Google (qualità bassa, verifica a mano)' };

  return null;
}

async function main() {
  const [nome, domain, prefix] = process.argv.slice(2);
  if (!nome) {
    console.error('Uso: node scripts/prepare-brand-logo.js "Nome Brand" [dominio.it] [prefixEAN]');
    process.exit(1);
  }

  const slug = slugify(nome);
  const logoFile = `${slug}.png`;
  const outPath = path.join(LOGHI_DIR, logoFile);

  if (fs.existsSync(outPath)) {
    console.error(`assets/loghi/${logoFile} esiste già - questo brand potrebbe essere già stato aggiunto.`);
    process.exit(1);
  }

  const entry = {
    prefix: prefix || '',
    brand: nome,
    logoFile,
    color: '#1E1E1E',
    domain: domain || null,
  };
  const notes = [];

  const candidate = await downloadCandidateLogo(domain);
  if (candidate) {
    const resized = await sharp(candidate.buffer)
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    fs.mkdirSync(LOGHI_DIR, { recursive: true });
    fs.writeFileSync(outPath, resized);
    notes.push(`Logo scaricato (${candidate.quality}) -> assets/loghi/${logoFile}`);

    const color = await estimateDominantColor(resized);
    if (color) {
      entry.color = color;
      notes.push(`Colore dominante stimato: ${color} - verifica che sia davvero il colore di marca.`);
    } else {
      notes.push('Non sono riuscito a stimare un colore dominante affidabile: scegline uno a mano.');
    }
  } else {
    notes.push('Nessun logo scaricato in automatico: aggiungi tu il file in assets/loghi/ seguendo lo standard, poi aggiorna logoFile/color qui sotto.');
  }

  notes.push('Prima di pubblicare, controlla anche: il prefix EAN (se lo conosci da una tessera vera) e se serve "boxColor" (solo se il logo ha un riquadro colorato pieno cucito dentro, es. IKEA/PAYBACK - vedi assets/loghi/README.md).');

  const draft = fs.existsSync(DRAFT_FILE) ? JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf8')) : [];
  draft.push({ ...entry, _notes: notes });
  fs.writeFileSync(DRAFT_FILE, JSON.stringify(draft, null, 2));

  console.log(`\nBozza pronta per "${nome}":\n`);
  console.log(JSON.stringify(entry, null, 2));
  console.log('\nNote:');
  notes.forEach((n) => console.log(`- ${n}`));
  console.log('\nSalvata anche in assets/brands.draft.json (bozze accumulate, non versionato - solo per revisione).');
}

main();
