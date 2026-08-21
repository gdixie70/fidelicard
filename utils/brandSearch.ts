import brands from '../assets/brands.json';
import logoMap from './logoMap';

type BrandEntry = {
  prefix: string;
  brand: string;
  logoFile: string;
  color: string;
  domain?: string;
};

export type BrandMatch = {
  brand: string;
  color: string;
  logoFile: string;
  logoUri: any | null;
  domain: string | null;
  score: number;
};

export const normalizeBrandText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // rimuove accenti (è, ò, ù, ...)
    .toLowerCase()
    .replace(/['’]/g, '') // "In's Mercato" -> "ins mercato"
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toMatch = (item: BrandEntry, score: number): BrandMatch => ({
  brand: item.brand,
  color: item.color,
  logoFile: item.logoFile,
  logoUri: logoMap[item.logoFile] || null,
  domain: item.domain || null,
  score,
});

/**
 * Cerca le catene che corrispondono al testo digitato dall'utente (nome negozio)
 * oppure al codice a barre (se il prefisso combacia). Ritorna i risultati ordinati
 * dal più pertinente, per alimentare un elenco di suggerimenti mentre si scrive.
 */
export function searchBrands(query: string, limit = 6): BrandMatch[] {
  const raw = query.trim();
  if (!raw) return [];

  const isNumeric = /^\d+$/.test(raw);
  const q = normalizeBrandText(raw);
  if (!isNumeric && q.length < 2) return [];

  const scored: { item: BrandEntry; score: number }[] = [];

  for (const item of brands as BrandEntry[]) {
    const name = normalizeBrandText(item.brand);
    let score = 0;

    if (isNumeric) {
      if (raw.startsWith(item.prefix)) score = 100;
    } else if (name === q) {
      score = 100;
    } else if (name.startsWith(q)) {
      score = 80;
    } else if (name.split(' ').some((word) => word.startsWith(q))) {
      score = 60;
    } else if (name.includes(q)) {
      score = 40;
    }

    if (score > 0) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.item.brand.length - b.item.brand.length)
    .slice(0, limit)
    .map(({ item, score }) => toMatch(item, score));
}

/**
 * Match ad alta confidenza (per l'auto-riconoscimento dal codice tessera,
 * dove non ha senso mostrare un elenco di suggerimenti).
 */
export function getBrandInfo(input: string): BrandMatch | null {
  const [top] = searchBrands(input, 1);
  return top && top.score >= 80 ? top : null;
}
