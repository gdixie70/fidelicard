import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const CACHE_DIR = new Directory(Paths.cache, 'brand-logos');
const REPO_RAW_BASE = 'https://raw.githubusercontent.com/gdixie70/fidelicard/main/assets/loghi';

// Sotto questa soglia consideriamo la risposta un errore (pagina 404, non un'immagine reale).
const MIN_VALID_LOGO_BYTES = 200;

function ensureCacheDir() {
  if (!CACHE_DIR.exists) {
    CACHE_DIR.create({ intermediates: true });
  }
}

// Evita fetch duplicati in parallelo quando più card dello stesso brand
// vengono renderizzate insieme (es. la lista carte).
const pending = new Map<string, Promise<string | null>>();

/**
 * Recupera il logo di un brand aggiunto a brands.json dopo l'ultima
 * pubblicazione dell'app (quindi non incluso nel bundle locale), scaricandolo
 * dalla cartella assets/loghi dello stesso repository GitHub del progetto e
 * mettendolo in cache sul dispositivo per gli utilizzi successivi (anche
 * offline). Ritorna null se siamo offline o il file non esiste ancora:
 * in quel caso la UI mostra il badge colorato generato automaticamente.
 */
export function getRemoteLogoUri(logoFile: string): Promise<string | null> {
  if (!logoFile || Platform.OS === 'web') return Promise.resolve(null);

  const existing = pending.get(logoFile);
  if (existing) return existing;

  const promise = fetchRemoteLogo(logoFile).finally(() => pending.delete(logoFile));
  pending.set(logoFile, promise);
  return promise;
}

/**
 * Controllo sincrono (nessuna rete): il logo di questo brand è già stato
 * scaricato e messo in cache in una sessione precedente? Serve a decidere
 * subito, al render, se lo sfondo della card deve essere bianco (logo vero
 * disponibile) o colorato (badge), senza aspettare il fetch asincrono.
 */
export function hasCachedLogo(logoFile: string | null | undefined): boolean {
  if (!logoFile || Platform.OS === 'web') return false;
  try {
    const cached = new File(CACHE_DIR, logoFile);
    return cached.exists && cached.size >= MIN_VALID_LOGO_BYTES;
  } catch {
    return false;
  }
}

async function fetchRemoteLogo(logoFile: string): Promise<string | null> {
  try {
    ensureCacheDir();
    const cached = new File(CACHE_DIR, logoFile);
    if (cached.exists) {
      if (cached.size < MIN_VALID_LOGO_BYTES) return null;
      // Mostriamo subito quello che abbiamo già in cache, e in parallelo
      // controlliamo se su GitHub è cambiato (es. un logo sostituito con uno
      // migliore): se sì, lo riscarichiamo per la prossima volta, senza far
      // aspettare questa richiesta né richiedere nessuna azione all'utente.
      revalidateInBackground(logoFile, cached);
      return cached.uri;
    }

    const downloaded = await File.downloadFileAsync(`${REPO_RAW_BASE}/${logoFile}`, cached);

    if (!downloaded.exists || downloaded.size < MIN_VALID_LOGO_BYTES) {
      if (downloaded.exists) downloaded.delete();
      return null;
    }

    return downloaded.uri;
  } catch {
    return null;
  }
}

// Evita revalidazioni duplicate in parallelo per lo stesso file.
const revalidating = new Set<string>();

async function revalidateInBackground(logoFile: string, cached: File): Promise<void> {
  if (revalidating.has(logoFile)) return;
  revalidating.add(logoFile);

  try {
    const head = await fetch(`${REPO_RAW_BASE}/${logoFile}`, { method: 'HEAD' });
    if (!head.ok) return;

    // Confrontiamo solo la dimensione (niente ETag da gestire): un logo
    // sostituito ha quasi sempre una dimensione diversa, ed è un controllo
    // leggero (nessun corpo scaricato) da fare ogni volta senza pesare sui
    // dati mobili.
    const remoteSize = Number(head.headers.get('content-length') || 0);
    if (!remoteSize || remoteSize === cached.size) return;

    await File.downloadFileAsync(`${REPO_RAW_BASE}/${logoFile}`, cached, { idempotent: true });
  } catch {
    // offline o GitHub irraggiungibile: teniamo la cache esistente, si
    // ritenterà al prossimo utilizzo di questo logo.
  } finally {
    revalidating.delete(logoFile);
  }
}
