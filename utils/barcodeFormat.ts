export type BarcodeFormat = 'EAN13' | 'EAN8' | 'CODE128';

/**
 * Indovina il formato più realistico per il codice di una tessera fedeltà,
 * che in genere è stampato come EAN13 o EAN8 (numerico) oppure CODE128
 * (alfanumerico, o lunghezza non standard).
 */
export function detectBarcodeFormat(code: string): BarcodeFormat {
  const digitsOnly = /^[0-9]+$/.test(code);
  if (digitsOnly) {
    if (code.length === 7 || code.length === 8) return 'EAN8';
    if (code.length === 12 || code.length === 13) return 'EAN13';
  }
  return 'CODE128';
}
