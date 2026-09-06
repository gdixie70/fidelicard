/**
 * Segnala automaticamente (senza alcuna azione da parte dell'utente) i nomi
 * di negozio digitati che non hanno trovato nessun brand corrispondente,
 * così da poter cercare/generare il logo in seguito - una volta aggiunto a
 * brands.json, arriverà agli utenti automaticamente tramite
 * utils/remoteBrands.ts, senza bisogno di un aggiornamento dell'app.
 *
 * Usa una Google Form come endpoint: gratuito, senza manutenzione, nessun
 * backend da tenere in piedi (a differenza del vecchio Supabase).
 *
 * Per attivarlo:
 * 1. Crea una Google Form con UNA domanda a risposta breve (es. "Negozio
 *    senza logo").
 * 2. Nel menu (⋮) della domanda scegli "Ottieni link precompilato",
 *    scrivi una risposta di prova, genera il link e copialo: contiene sia
 *    l'ID della form sia l'ID della domanda, es.
 *    https://docs.google.com/forms/d/e/ABCDEF.../viewform?entry.123456789=prova
 * 3. Sostituisci qui sotto FORM_ID (la parte tra /d/e/ e /viewform) e
 *    NAME_FIELD_ENTRY (es. "entry.123456789").
 */
const FORM_ID = null as string | null; // es. '1FAIpQLSf...'
const NAME_FIELD_ENTRY = null as string | null; // es. 'entry.123456789'

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
