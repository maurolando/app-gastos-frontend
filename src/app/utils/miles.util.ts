import { formatNumber } from '@angular/common';

/**
 * Formato de los importes que el usuario escribe (issue #34).
 *
 * Usa formatNumber con el mismo patron '1.0-0' que las tablas, para que lo que
 * se tipea y lo que se lee despues coincidan siempre.
 *
 * Usa el LOCALE_ID de la app (es-PY, registrado en AppModule): miles con punto.
 *
 * shortcut: solo enteros con separador de miles, que es lo unico que maneja la
 * app (todo en guaranies). Si algun dia hay otra moneda con centavos, esto tiene
 * que recibir la moneda y decidir los decimales.
 */
export function formatearMiles(valor: number | string | null | undefined, locale: string): string {
  // Los formularios arrancan el monto en '' y formatNumber lo convertía en "0".
  if (valor === null || valor === undefined || valor === '' || isNaN(Number(valor))) return '';
  return formatNumber(Number(valor), locale, '1.0-0');
}

/** Lee lo tipeado quedandose solo con los digitos. Vacio devuelve null, no 0. */
export function leerMiles(texto: string): number | null {
  const digitos = (texto || '').replace(/\D/g, '');
  return digitos ? Number(digitos) : null;
}
