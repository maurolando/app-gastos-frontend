import { Directive, ElementRef, HostListener, Inject, LOCALE_ID, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { formatearMiles, leerMiles } from '../utils/miles.util';

/**
 * Muestra el importe con separador de miles mientras se escribe (issue #34).
 *
 * Es un ControlValueAccessor y no un simple listener porque el input tiene que
 * pasar a type="text": un type="number" no acepta un valor con separadores, el
 * navegador lo descarta y el campo queda vacio.
 *
 * shortcut: el cursor queda siempre al final, porque reformatear corre la
 * posicion. Alcanza para tipear un monto de izquierda a derecha; si hiciera
 * falta editar en el medio, hay que calcular el offset contando digitos.
 */
@Directive({
  selector: 'input[appMiles]',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MilesDirective),
    multi: true
  }]
})
export class MilesDirective implements ControlValueAccessor {

  private alCambiar: (valor: number | null) => void = () => {};
  private alTocar: () => void = () => {};

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  writeValue(valor: number | null): void {
    this.el.nativeElement.value = formatearMiles(valor, this.locale);
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.el.nativeElement.disabled = deshabilitado;
  }

  @HostListener('input')
  escribio(): void {
    const numero = leerMiles(this.el.nativeElement.value);
    // El formulario guarda el numero; el input muestra la version con separadores.
    this.el.nativeElement.value = formatearMiles(numero, this.locale);
    this.alCambiar(numero);
  }

  @HostListener('blur')
  salio(): void {
    this.alTocar();
  }
}
