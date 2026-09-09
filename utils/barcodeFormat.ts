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

/**
 * UPC-A ed EAN-13 sono lo stesso codice a barre: UPC-A è EAN-13 con lo "0"
 * iniziale sottinteso. Gli scanner (l'API nativa della fotocamera e ML Kit,
 * soprattutto su iOS) a volte restituiscono un EAN-13 che comincia per 0
 * come se fosse un UPC-A a 12 cifre, perdendo quello zero: senza questa
 * correzione il codice salvato - e il barcode rigenerato per mostrarlo in
 * cassa - non corrisponde più a quello davvero stampato sulla tessera.
 *
 * Va chiamata solo quando il tipo di codice a barre arriva da un vero
 * lettore (scanner dal vivo, foto, ML Kit) - mai su un codice scritto a
 * mano dall'utente, dove un 12 cifre potrebbe essere legittimo così com'è.
 */
export function restoreLeadingZero(value: string, isUpcOrEan13: boolean): string {
  if (isUpcOrEan13 && value.length === 12 && /^[0-9]+$/.test(value)) {
    return '0' + value;
  }
  return value;
}
