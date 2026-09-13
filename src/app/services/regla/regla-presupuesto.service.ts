import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { Categoria, Presupuesto } from '../expense/expense.service';
import { GrupoGasto, PlantillaRegla } from 'src/app/utils/distribucion.util';

export interface PorcentajeGrupo {
  grupo: GrupoGasto;
  porcentaje: number;
}

export interface ReglaPresupuesto {
  plantilla: PlantillaRegla;
  porcentajes: PorcentajeGrupo[];
}

export interface PartidaDistribucion {
  clave: string;
  nombre: string;
  porcentaje: number;
  grupos: GrupoGasto[];
  montoRecomendado: number;
  montoReal: number;
  porcentajeReal: number;
  esAhorro: boolean;
}

export interface DistribucionRegla {
  activa: boolean;
  plantilla: PlantillaRegla;
  plantillaSugerida: PlantillaRegla | null;
  ingresoMensual: number;
  partidas: PartidaDistribucion[];
  montoSinClasificar: number;
  categoriasSinClasificar: number;
}

export interface PresupuestoSugerido {
  categoria: Categoria;
  partida: string;
  montoSugerido: number;
  /** Lo gastado en la categoría (el mayor entre el mes anterior y el actual). */
  montoReferencia: number;
  montoActual: number | null;
}

export interface PresupuestoInput {
  categoriaId: string;
  monto: number;
}

const GET_REGLA = gql`
  query GetReglaPresupuesto {
    getReglaPresupuesto {
      plantilla
      porcentajes { grupo porcentaje }
    }
  }
`;

const GET_DISTRIBUCION = gql`
  query GetDistribucionRegla($mes: Int!, $anio: Int!) {
    getDistribucionRegla(mes: $mes, anio: $anio) {
      activa
      plantilla
      plantillaSugerida
      ingresoMensual
      montoSinClasificar
      categoriasSinClasificar
      partidas {
        clave
        nombre
        porcentaje
        grupos
        montoRecomendado
        montoReal
        porcentajeReal
        esAhorro
      }
    }
  }
`;

const GET_SUGERIDOS = gql`
  query GetPresupuestosSugeridos($mes: Int!, $anio: Int!) {
    getPresupuestosSugeridos(mes: $mes, anio: $anio) {
      partida
      montoSugerido
      montoReferencia
      montoActual
      categoria { id nombre icono tipo grupo }
    }
  }
`;

const GUARDAR_REGLA = gql`
  mutation GuardarReglaPresupuesto($plantilla: PlantillaRegla!, $porcentajes: [PorcentajeGrupoInput!]) {
    guardarReglaPresupuesto(plantilla: $plantilla, porcentajes: $porcentajes) {
      plantilla
      porcentajes { grupo porcentaje }
    }
  }
`;

const DESACTIVAR_REGLA = gql`
  mutation DesactivarReglaPresupuesto {
    desactivarReglaPresupuesto
  }
`;

const APLICAR_PRESUPUESTOS = gql`
  mutation AplicarPresupuestos($mes: Int!, $anio: Int!, $presupuestos: [PresupuestoInput!]!) {
    aplicarPresupuestos(mes: $mes, anio: $anio, presupuestos: $presupuestos) {
      id
      monto
      mes
      anio
      categoria { id nombre icono tipo }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ReglaPresupuestoService {

  constructor(private apollo: Apollo) { }

  getRegla(): Observable<ReglaPresupuesto | null> {
    return this.apollo.query<any>({
      query: GET_REGLA,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.getReglaPresupuesto)
    );
  }

  getDistribucion(mes: number, anio: number): Observable<DistribucionRegla> {
    return this.apollo.watchQuery<any>({
      query: GET_DISTRIBUCION,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getDistribucionRegla)
    );
  }

  getPresupuestosSugeridos(mes: number, anio: number): Observable<PresupuestoSugerido[]> {
    return this.apollo.query<any>({
      query: GET_SUGERIDOS,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.getPresupuestosSugeridos)
    );
  }

  guardarRegla(plantilla: PlantillaRegla, porcentajes?: PorcentajeGrupo[]): Observable<ReglaPresupuesto> {
    return this.apollo.mutate<any>({
      mutation: GUARDAR_REGLA,
      variables: { plantilla, porcentajes: plantilla === 'PERSONALIZADA' ? porcentajes : null },
      refetchQueries: ['GetDistribucionRegla']
    }).pipe(
      map(result => result.data.guardarReglaPresupuesto)
    );
  }

  desactivarRegla(): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: DESACTIVAR_REGLA,
      refetchQueries: ['GetDistribucionRegla']
    }).pipe(
      map(result => result.data.desactivarReglaPresupuesto)
    );
  }

  aplicarPresupuestos(mes: number, anio: number, presupuestos: PresupuestoInput[]): Observable<Presupuesto[]> {
    return this.apollo.mutate<any>({
      mutation: APLICAR_PRESUPUESTOS,
      variables: { mes, anio, presupuestos },
      refetchQueries: ['GetPresupuestos', 'GetDistribucionRegla']
    }).pipe(
      map(result => result.data.aplicarPresupuestos)
    );
  }
}
