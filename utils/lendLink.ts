// Link "peer-to-peer": tutti i dati della tessera viaggiano dentro l'URL
// stesso, non serve nessun server. Funziona solo da una build vera
// dell'app (Expo Go non registra lo schema fidelicard:// col sistema).
const SCHEME = 'fidelicard';
const HOST = 'prestito';

export type LendPayload = {
  nome: string;
  codice: string;
  logoFile: string | null;
  colore: string;
  da: string; // nome di chi presta
  scadenza: string | null; // ISO, null = per sempre
};

export function buildLendLink(payload: LendPayload): string {
  const params = new URLSearchParams();
  params.set('nome', payload.nome);
  params.set('codice', payload.codice);
  if (payload.logoFile) params.set('logoFile', payload.logoFile);
  params.set('colore', payload.colore);
  params.set('da', payload.da);
  if (payload.scadenza) params.set('scadenza', payload.scadenza);

  return `${SCHEME}://${HOST}?${params.toString()}`;
}

export function parseLendLink(url: string): LendPayload | null {
  try {
    // React Native non ha URL/URLSearchParams affidabili per schemi custom
    // su tutte le piattaforme: estraiamo la query a mano.
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) return null;
    if (!url.toLowerCase().includes(`${SCHEME}://${HOST}`)) return null;

    const query = url.slice(queryIndex + 1);
    const params = new URLSearchParams(query);

    const nome = params.get('nome');
    const codice = params.get('codice');
    const da = params.get('da');
    if (!nome || !codice || !da) return null;

    return {
      nome,
      codice,
      logoFile: params.get('logoFile'),
      colore: params.get('colore') || '#1E1E1E',
      da,
      scadenza: params.get('scadenza'),
    };
  } catch {
    return null;
  }
}
