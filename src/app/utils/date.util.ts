/**
 * Formatea una fecha como 'YYYY-MM-DD' respetando el huso horario local.
 *
 * No usar toISOString(): convierte a UTC y, en husos negativos como el nuestro
 * (UTC-3), una fecha tomada del datepicker (medianoche local) retrocede un día.
 * Un gasto del 1 de agosto terminaba guardado como 31 de julio y desaparecía
 * del dashboard del mes actual.
 */
/**
 * Convierte un 'YYYY-MM-DD' del backend en un Date en el huso local.
 *
 * `new Date('2026-08-01')` lo interpreta como medianoche UTC, que en UTC-3 es el
 * 31 de julio a las 21:00: el datepicker mostraría el día anterior al guardado.
 * Es el mismo desfase que toLocalISODate() evita en el sentido contrario.
 */
export function fromLocalISODate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const [anio, mes, dia] = value.split('-').map(Number);
  if (!anio || !mes || !dia) return null;

  return new Date(anio, mes - 1, dia);
}

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
