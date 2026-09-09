import { locale } from './i18n';

export type DurationOption = {
  key: string;
  label: string;
  addMonths?: number;
  addDays?: number;
  addHours?: number;
  endOfToday?: boolean;
};

const LABELS_IT: Record<string, string> = {
  '1h': '1 ora',
  today: 'Oggi',
  '1w': '1 settimana',
  '1m': '1 mese',
  '6m': '6 mesi',
  '1y': '1 anno',
  forever: 'Per sempre',
};

const LABELS_EN: Record<string, string> = {
  '1h': '1 hour',
  today: 'Today',
  '1w': '1 week',
  '1m': '1 month',
  '6m': '6 months',
  '1y': '1 year',
  forever: 'Forever',
};

const LABELS = locale === 'en' ? LABELS_EN : LABELS_IT;

// Scelta volutamente semplice: poche opzioni fisse, niente calendario da
// scorrere. Le durate brevi (1 ora / oggi) coprono il caso più comune del
// prestito - "usa la mia carta per la spesa di oggi" - mentre "per sempre" è
// pensato anche per una raccolta punti condivisa in famiglia, dove la
// tessera resta "in prestito" senza una vera scadenza.
export const DURATION_OPTIONS: DurationOption[] = [
  { key: '1h', label: LABELS['1h'], addHours: 1 },
  { key: 'today', label: LABELS.today, endOfToday: true },
  { key: '1w', label: LABELS['1w'], addDays: 7 },
  { key: '1m', label: LABELS['1m'], addMonths: 1 },
  { key: '6m', label: LABELS['6m'], addMonths: 6 },
  { key: '1y', label: LABELS['1y'], addMonths: 12 },
  { key: 'forever', label: LABELS.forever },
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
  return locale === 'en'
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
