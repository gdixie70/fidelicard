import { Platform } from 'react-native';
import { scanFromURLAsync, BarcodeType } from 'expo-camera';
import MLKitBarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import MLKitTextRecognition from '@react-native-ml-kit/text-recognition';
import { getBrandInfo, findBrandInText, BrandMatch } from './brandSearch';

const DECODABLE_BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'codabar',
  'itf14',
  'qr',
];

export type ImageDetectionResult = {
  codice: string | null;
  brand: BrandMatch | null;
};

/**
 * Prova a leggere sia il codice a barre sia il nome del negozio da una
 * foto/screenshot (es. una tessera già registrata in un'altra app). Usata
 * sia per l'importazione di una singola tessera sia per quella multipla.
 */
export async function detectCardFromImage(uri: string): Promise<ImageDetectionResult> {
  let codice: string | null = null;

  try {
    const decoded = await scanFromURLAsync(uri, DECODABLE_BARCODE_TYPES);
    if (decoded.length > 0) codice = decoded[0].data;
  } catch {
    // si prova comunque con ML Kit qui sotto
  }

  // Limite noto di iOS: l'API nativa di Apple usata sopra (Core Image)
  // riconosce da una foto statica solo i QR code. Come ripiego, su iOS
  // proviamo con Google ML Kit (richiede una build vera: in Expo Go non è
  // disponibile e il tentativo fallisce in silenzio).
  if (!codice && Platform.OS === 'ios') {
    try {
      const barcodes = await MLKitBarcodeScanning.scan(uri);
      if (barcodes.length > 0) codice = barcodes[0].value;
    } catch {
      // modulo nativo non disponibile o nessun barcode trovato
    }
  }

  let brand: BrandMatch | null = null;
  try {
    const { text: interoTesto, blocks } = await MLKitTextRecognition.recognize(uri);
    const righe = blocks.flatMap((block) => block.lines.map((line) => line.text));

    // Prima un confronto "pulito" per riga (la riga combacia esattamente o
    // inizia col nome del brand), poi - se non basta - un confronto "il
    // brand è contenuto nella riga" (utile per righe tipo "Carta Fedeltà
    // Arcaplanet"), infine lo stesso confronto sull'intero testo letto,
    // per i casi in cui il nome finisce spezzato su più righe.
    for (const riga of righe) {
      const match = getBrandInfo(riga);
      if (match) {
        brand = match;
        break;
      }
    }
    if (!brand) {
      for (const riga of righe) {
        const match = findBrandInText(riga);
        if (match) {
          brand = match;
          break;
        }
      }
    }
    if (!brand) {
      brand = findBrandInText(interoTesto);
    }
  } catch {
    // modulo nativo non disponibile: nessun nome auto-rilevato
  }

  return { codice, brand };
}
