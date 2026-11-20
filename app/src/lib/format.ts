const dateFormatter = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** plural(3, 'apunte', 'apuntes') → "3 apuntes" */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Quita acentos y mayúsculas para comparar textos al buscar. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
