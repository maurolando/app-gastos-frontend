import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';

/**
 * Único lugar donde vive el corte entre móvil y escritorio.
 *
 * Estaba repetido como número mágico en cada componente que lo necesitaba, y
 * el layout se desincronizaba: el sidenav se replegaba a un ancho y la tabla
 * pasaba a tarjetas en otro.
 */
export const CORTE_MOVIL = '(max-width: 900px)';

@Injectable({ providedIn: 'root' })
export class LayoutService {

  /** Teléfonos y tablets en vertical. */
  readonly esMovil$ = this.breakpoints.observe(CORTE_MOVIL).pipe(
    map(estado => estado.matches),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private breakpoints: BreakpointObserver) {}

  /** Versión sincrónica, para decidir dentro de un handler. */
  get esMovil(): boolean {
    return this.breakpoints.isMatched(CORTE_MOVIL);
  }
}
