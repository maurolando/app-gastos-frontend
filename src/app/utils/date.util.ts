/**
 * Formatea una fecha como 'YYYY-MM-DD' respetando el huso horario local.
 *
 * No usar toISOString(): convierte a UTC y, en husos negativos como el nuestro
 * (UTC-3), una fecha tomada del datepicker (medianoche local) retrocede un día.
 * Un gasto del 1 de agosto terminaba guardado como 31 de julio y desaparecía
 * del dashboard del mes actual.
 */
export function toLocalISODate(value: Date | string): string;
export function toLocalISODate(value: Date | string | null | undefined): string | null;
export function toLocalISODate(value: Date | string | null | undefined): string | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;

  const mes = `${date.getMonth() + 1}`.padStart(2, '0');
  const dia = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${mes}-${dia}`;
}
