import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { from, map, Observable, switchMap, of } from 'rxjs';
import { toLocalISODate } from 'src/app/utils/date.util';

/** El mes del hogar arranca el diaInicioMes (1-28): con 4, "octubre" va del 4/10 al 3/11. */
export interface ConfigHogar {
  diaInicioMes: number;
  cierreAutomatico: boolean;
}

const GET_CONFIG = gql`
  query GetConfigHogar {
    getConfigHogar { diaInicioMes cierreAutomatico }
  }
`;

const SET_CONFIG = gql`
  mutation SetConfigHogar($diaInicioMes: Int!, $cierreAutomatico: Boolean!, $hoy: String!) {
    setConfigHogar(diaInicioMes: $diaInicioMes, cierreAutomatico: $cierreAutomatico, hoy: $hoy) {
      diaInicioMes cierreAutomatico
    }
  }
`;

const CERRAR_PENDIENTES = gql`
  mutation CerrarMesesPendientes($hoy: String!) {
    cerrarMesesPendientes(hoy: $hoy)
  }
`;

// "hoy" sale del dispositivo: el servidor corre en UTC y adelantaría el corte 3 horas.
const hoy = () => toLocalISODate(new Date());

@Injectable({ providedIn: 'root' })
export class HogarService {
  constructor(private apollo: Apollo) {}

  getConfig(): Observable<ConfigHogar> {
    return this.apollo.query<any>({ query: GET_CONFIG, fetchPolicy: 'network-only' }).pipe(
      map(r => r.data.getConfigHogar)
    );
  }

  /** Cambiar el día reparte distinto gastos e ingresos entre meses: se descarta todo lo cacheado. */
  setConfig(diaInicioMes: number, cierreAutomatico: boolean): Observable<ConfigHogar> {
    return this.apollo.mutate<any>({
      mutation: SET_CONFIG,
      variables: { diaInicioMes, cierreAutomatico, hoy: hoy() }
    }).pipe(
      map(r => r.data.setConfigHogar),
      switchMap(config => from(this.apollo.client.resetStore()).pipe(map(() => config)))
    );
  }

  /** Cierra los meses ya terminados si el hogar tiene el cierre automático. Devuelve cuántos. */
  cerrarPendientes(): Observable<number> {
    return this.apollo.mutate<any>({ mutation: CERRAR_PENDIENTES, variables: { hoy: hoy() } }).pipe(
      map(r => r.data.cerrarMesesPendientes as number),
      switchMap(n => n > 0
        ? from(this.apollo.client.refetchQueries({ include: 'active' })).pipe(map(() => n))
        : of(n))
    );
  }
}
