export type DurationOption = {
  key: string;
  label: string;
  addMonths?: number;
  addDays?: number;
};

// Scelta volutamente semplice: poche opzioni fisse, niente calendario da
// scorrere. "Per sempre" è pensato anche per una raccolta punti condivisa
// in famiglia, dove la tessera resta "in prestito" senza una vera scadenza.
export const DURATION_OPTIONS: DurationOption[] = [
  { key: '1w', label: '1 settimana', addDays: 7 },
  { key: '1m', label: '1 mese', addMonths: 1 },
  { key: '6m', label: '6 mesi', addMonths: 6 },
  { key: '1y', label: '1 anno', addMonths: 12 },
  { key: 'forever', label: 'Per sempre' },
];

export function computeExpiryDate(option: DurationOption, from: Date = new Date()): Date | null {
  if (!option.addMonths && !option.addDays) return null; // "Per sempre"

  const result = new Date(from);
  if (option.addMonths) result.setMonth(result.getMonth() + option.addMonths);
  if (option.addDays) result.setDate(result.getDate() + option.addDays);
  return result;
}

export function formatDateIt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
