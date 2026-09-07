/**
 * Segnala automaticamente (senza alcuna azione da parte dell'utente) i nomi
 * di negozio digitati che non hanno trovato nessun brand corrispondente,
 * così da poter cercare/generare il logo in seguito - una volta aggiunto a
 * brands.json, arriverà agli utenti automaticamente tramite
 * utils/remoteBrands.ts, senza bisogno di un aggiornamento dell'app.
 *
 * Usa una Google Form ("Menu Senza Logo") come endpoint: gratuito, senza
 * manutenzione, nessun backend da tenere in piedi (a differenza del
 * vecchio Supabase). Le risposte arrivano nel foglio Google collegato alla
 * form.
 */
const FORM_ID: string | null = '1FAIpQLSfF-BWzYEwTmulSxve3tGI13kKQVrapDc9n1BHkZPbsxgbuSA';
const NAME_FIELD_ENTRY: string | null = 'entry.868566266';

export async function reportMissingLogo(nome: string): Promise<void> {
  if (!FORM_ID || !NAME_FIELD_ENTRY || !nome.trim()) return;

  try {
    const body = new URLSearchParams({ [NAME_FIELD_ENTRY]: nome.trim() });
    await fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch {
    // È solo un segnale opportunistico: non deve mai bloccare o disturbare
    // il salvataggio della tessera se la richiesta fallisce.
  }
}
