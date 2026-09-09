// expo-file-system v18+ (SDK 57) ha sostituito questa API con classi File/
// Directory; /legacy tiene ancora le funzioni semplici (writeAsStringAsync
// ecc.) che ci bastano per un file di backup usa-e-getta.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { loadAllCards, saveAllCards, findByExactCode } from './cardStore';
import { generateId } from './id';
import { Carta } from './types';

const BACKUP_APP_TAG = 'FideliCard';

type BackupFile = {
  app: string;
  versione: number;
  esportatoIl: string;
  tessere: Carta[];
};

export async function exportCards(): Promise<{ count: number } | null> {
  const tessere = await loadAllCards();
  if (tessere.length === 0) return null;

  const payload: BackupFile = {
    app: BACKUP_APP_TAG,
    versione: 1,
    esportatoIl: new Date().toISOString(),
    tessere,
  };

  const fileUri = `${FileSystem.cacheDirectory}fidelicard-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Salva il backup delle tue tessere',
    });
  }

  return { count: tessere.length };
}

export type ImportOutcome = { added: number; skipped: number };

/**
 * Chiede all'utente un file di backup, lo unisce a quello che ha già sul
 * telefono. Una tessera con lo stesso codice a barre di una già presente
 * viene saltata (non sovrascritta): l'unione non cancella mai nulla.
 */
export async function importCards(): Promise<ImportOutcome | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const parsed = JSON.parse(content);
  const imported: unknown = Array.isArray(parsed) ? parsed : parsed?.tessere;
  if (!Array.isArray(imported)) {
    throw new Error('Il file non è un backup di FideliCard valido.');
  }

  const existing = await loadAllCards();
  const next = [...existing];
  let added = 0;
  let skipped = 0;

  for (const raw of imported) {
    const card = raw as Partial<Carta>;
    if (!card || typeof card.nome !== 'string' || typeof card.codice !== 'string') continue;
    if (findByExactCode(next, card.codice)) {
      skipped++;
      continue;
    }
    next.push({ ...card, id: generateId() } as Carta);
    added++;
  }

  await saveAllCards(next);
  return { added, skipped };
}
