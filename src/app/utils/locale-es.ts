import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** La app muestra todo como en Paraguay: fechas dd/mm/aaaa y miles con punto (issue #38). */
export const LOCALE_APP = 'es-PY';

/**
 * Lee lo tipeado como dd/mm/aaaa. NativeDateAdapter usa Date.parse, que solo entiende
 * el formato de EE. UU.: "31/10/2026" daba fecha invalida y "01/02/2026" se guardaba
 * como 2 de enero.
 */
export function leerFechaDma(texto: string): Date | null {
  const m = /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})\s*$/.exec(texto || '');
  if (!m) return null;
  const [dia, mes] = [Number(m[1]), Number(m[2])];
  const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const fecha = new Date(anio, mes - 1, dia);
  // Descarta 31/02 y parecidos, que Date corre al mes siguiente sin avisar.
  return fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null;
}

@Injectable()
export class FechaDmaAdapter extends NativeDateAdapter {
  override parse(valor: any): Date | null {
    if (typeof valor === 'string') {
      if (!valor.trim()) return null;
      return leerFechaDma(valor) ?? this.invalid();
    }
    return super.parse(valor);
  }
}

@Injectable()
export class PaginadorEs extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Por página:';
  override nextPageLabel = 'Página siguiente';
  override previousPageLabel = 'Página anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';
  override getRangeLabel = (pagina: number, tamano: number, total: number): string => {
    if (total === 0 || tamano === 0) return `0 de ${total}`;
    const desde = pagina * tamano;
    return `${desde + 1} – ${Math.min(desde + tamano, total)} de ${total}`;
  };
}
