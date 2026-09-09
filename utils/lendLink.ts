// Link "peer-to-peer": tutti i dati della tessera viaggiano dentro l'URL
// stesso, non serve nessun server. Il link condiviso è un https:// (così
// WhatsApp/SMS lo rendono cliccabile) che punta a prestito.html: quella
// pagina, se l'app è installata, rilancia da sola lo schema fidelicard://
// qui sotto, che è quello che l'app intercetta davvero (vedi
// LendRequestHandler). Il solo fidelicard:// non è mai cliccabile in una
// chat, quindi non va condiviso direttamente.
const SCHEME = 'fidelicard';
const HOST = 'prestito';
const WEB_SHARE_URL = 'https://fidelicard.it/prestito.html';

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

  return `${WEB_SHARE_URL}?${params.toString()}`;
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
