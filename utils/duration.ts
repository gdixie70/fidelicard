export type DurationOption = {
  key: string;
  label: string;
  addMonths?: number;
  addDays?: number;
  addHours?: number;
  endOfToday?: boolean;
};

// Scelta volutamente semplice: poche opzioni fisse, niente calendario da
// scorrere. Le durate brevi (1 ora / oggi) coprono il caso più comune del
// prestito - "usa la mia carta per la spesa di oggi" - mentre "per sempre" è
// pensato anche per una raccolta punti condivisa in famiglia, dove la
// tessera resta "in prestito" senza una vera scadenza.
export const DURATION_OPTIONS: DurationOption[] = [
  { key: '1h', label: '1 ora', addHours: 1 },
  { key: 'today', label: 'Oggi', endOfToday: true },
  { key: '1w', label: '1 settimana', addDays: 7 },
  { key: '1m', label: '1 mese', addMonths: 1 },
  { key: '6m', label: '6 mesi', addMonths: 6 },
  { key: '1y', label: '1 anno', addMonths: 12 },
  { key: 'forever', label: 'Per sempre' },
];

export function computeExpiryDate(option: DurationOption, from: Date = new Date()): Date | null {
  if (option.endOfToday) {
    const result = new Date(from);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  if (!option.addMonths && !option.addDays && !option.addHours) return null; // "Per sempre"

  const result = new Date(from);
  if (option.addMonths) result.setMonth(result.getMonth() + option.addMonths);
  if (option.addDays) result.setDate(result.getDate() + option.addDays);
  if (option.addHours) result.setHours(result.getHours() + option.addHours);
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
