import { registerLocaleData } from '@angular/common';
import localeEsPy from '@angular/common/locales/es-PY';
import { formatearMiles, leerMiles } from './miles.util';

registerLocaleData(localeEsPy);

describe('miles.util', () => {

  it('separa los miles con el mismo formato que las tablas', () => {
    expect(formatearMiles(1800000, 'en-US')).toBe('1,800,000');
  });

  it('no inventa un cero cuando el campo esta vacio', () => {
    expect(formatearMiles(null, 'en-US')).toBe('');
    expect(formatearMiles('', 'en-US')).toBe('');
    expect(leerMiles('')).toBeNull();
  });

  it('usa punto de miles en es-PY, el locale de la app', () => {
    expect(formatearMiles(1800000, 'es-PY')).toBe('1.800.000');
  });

  it('se queda solo con los digitos de lo tipeado', () => {
    expect(leerMiles('1,800,000')).toBe(1800000);
    expect(leerMiles('450.000')).toBe(450000);
  });

  it('no convierte en cero un monto que arranca con separadores', () => {
    expect(leerMiles(',,,')).toBeNull();
  });
});
