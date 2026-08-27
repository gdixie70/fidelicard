export type Prestito = {
  destinatario: string;
  concessoIl: string; // ISO date
  scadenza: string | null; // null = per sempre
};

export type Carta = {
  id: string;
  nome: string;
  codice: string;
  uso?: number;
  logoFile?: string | null;
  colore?: string;
  // Rimozione automatica di QUESTA carta (tipicamente su una copia ricevuta
  // in prestito): passata la data, la carta sparisce dal wallet di chi la
  // tiene. Non ha nessun effetto sulla carta originale di chi presta.
  scadenza?: string | null;
  // Presente solo sulla carta di chi presta: a chi è stata prestata e con
  // quale promemoria di scadenza. Puramente informativo/di elenco - un
  // codice a barre condiviso non si può revocare da remoto.
  prestiti?: Prestito[];
  // Presente solo sulla copia ricevuta in prestito: chi l'ha prestata.
  prestataDa?: string | null;
};
