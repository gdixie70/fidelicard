import AsyncStorage from '@react-native-async-storage/async-storage';
import { Carta } from './types';
import { generateId } from './id';
import { LendPayload } from './lendLink';

const KEY = 'carte';

export async function loadAllCards(): Promise<Carta[]> {
  const json = await AsyncStorage.getItem(KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveAllCards(cards: Carta[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(cards));
}

/**
 * Legge lo stato più recente da disco, applica le modifiche a UNA carta
 * (per id) e salva - usato da più schermate (Carte, Collabora) per non
 * rischiare di sovrascrivere modifiche fatte nel frattempo altrove.
 */
export async function updateCardById(id: string, changes: Partial<Carta>): Promise<Carta[]> {
  const cards = await loadAllCards();
  const next = cards.map((c) => (c.id === id ? { ...c, ...changes } : c));
  await saveAllCards(next);
  return next;
}

/**
 * Una tessera ricevuta in prestito è "duplicata" solo se il codice coincide
 * esattamente con una già presente: un utente può avere sia la propria
 * tessera di un brand sia una o più tessere dello stesso brand prestate da
 * persone diverse, purché i codici siano diversi.
 */
export function findByExactCode(cards: Carta[], codice: string): Carta | undefined {
  return cards.find((c) => c.codice === codice.trim());
}

export type AcceptLendResult =
  | { status: 'added'; card: Carta }
  | { status: 'duplicate'; card: Carta };

export async function acceptLentCard(payload: LendPayload): Promise<AcceptLendResult> {
  const cards = await loadAllCards();
  const existing = findByExactCode(cards, payload.codice);
  if (existing) {
    return { status: 'duplicate', card: existing };
  }

  const nuovaCarta: Carta = {
    id: generateId(),
    nome: payload.nome,
    codice: payload.codice,
    logoFile: payload.logoFile,
    colore: payload.colore,
    scadenza: payload.scadenza,
    prestataDa: payload.da,
  };

  await saveAllCards([...cards, nuovaCarta]);
  return { status: 'added', card: nuovaCarta };
}
