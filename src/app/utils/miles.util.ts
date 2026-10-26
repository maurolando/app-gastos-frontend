import { formatNumber } from '@angular/common';

/**
 * Formato de los importes que el usuario escribe (issue #34).
 *
 * Usa formatNumber con el mismo patron '1.0-0' que las tablas, para que lo que
 * se tipea y lo que se lee despues coincidan siempre.
 *
 * Ojo si algun dia se cambia el LOCALE_ID: formatNumber necesita que el locale
 * este registrado con registerLocaleData o falla. Hoy la app usa el default.
 *
 * shortcut: solo enteros con separador de miles, que es lo unico que maneja la
 * app (todo en guaranies). Si algun dia hay otra moneda con centavos, esto tiene
 * que recibir la moneda y decidir los decimales.
 */
export function formatearMiles(valor: number | null | undefined, locale: string): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '';
  return formatNumber(valor, locale, '1.0-0');
}

/** Lee lo tipeado quedandose solo con los digitos. Vacio devuelve null, no 0. */
export function leerMiles(texto: string): number | null {
  const digitos = (texto || '').replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}
