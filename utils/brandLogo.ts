import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const CACHE_DIR = new Directory(Paths.cache, 'brand-logos');

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
 * Recupera il logo reale di un brand da un servizio pubblico (Clearbit Logo API),
 * mettendolo in cache sul dispositivo per gli utilizzi successivi (anche offline).
 * Ritorna null se il dominio non è configurato, siamo offline, o il logo non esiste:
 * in quel caso la UI mostra il badge colorato generato automaticamente.
 */
export function getRemoteLogoUri(domain: string): Promise<string | null> {
  if (!domain || Platform.OS === 'web') return Promise.resolve(null);

  const existing = pending.get(domain);
  if (existing) return existing;

  const promise = fetchRemoteLogo(domain).finally(() => pending.delete(domain));
  pending.set(domain, promise);
  return promise;
}

async function fetchRemoteLogo(domain: string): Promise<string | null> {
  try {
    ensureCacheDir();
    const cached = new File(CACHE_DIR, `${domain}.png`);
    if (cached.exists) {
      return cached.size >= MIN_VALID_LOGO_BYTES ? cached.uri : null;
    }

    const downloaded = await File.downloadFileAsync(
      `https://logo.clearbit.com/${domain}?size=256`,
      cached
    );

    if (!downloaded.exists || downloaded.size < MIN_VALID_LOGO_BYTES) {
      if (downloaded.exists) downloaded.delete();
      return null;
    }

    return downloaded.uri;
  } catch {
    return null;
  }
}
