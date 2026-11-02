import { leerFechaDma, PaginadorEs } from './locale-es';

describe('locale-es', () => {

  it('lee dd/mm/aaaa como dia y mes, no al reves', () => {
    expect(leerFechaDma('01/02/2026')).toEqual(new Date(2026, 1, 1));
    expect(leerFechaDma('31/10/26')).toEqual(new Date(2026, 9, 31));
  });

  it('rechaza fechas que no existen o texto suelto', () => {
    expect(leerFechaDma('31/02/2026')).toBeNull();
    expect(leerFechaDma('hoy')).toBeNull();
  });

  it('arma el rango del paginador en espanol', () => {
    expect(new PaginadorEs().getRangeLabel(1, 15, 20)).toBe('16 – 20 de 20');
  });
});
