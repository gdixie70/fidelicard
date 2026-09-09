// Funzioni condivise tra scripts/prepare-brand-logo.js e
// scripts/publish-logo-server.js.
const sharp = require('sharp');

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

module.exports = { slugify, estimateDominantColor };
