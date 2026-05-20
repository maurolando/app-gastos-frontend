import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { Persona } from '../persona/persona.service';

export interface Ahorro {
  id?: string;
  monto: number;
  fecha: string;
  descripcion?: string;
  persona?: Persona;
}

const GET_AHORROS = gql`
  query GetAllAhorros($mes: Int, $anio: Int) {
    getAllAhorros(mes: $mes, anio: $anio) {
      id
      monto
      fecha
      descripcion
      persona {
        id
        nombre
      }
    }
  }
`;

const CREATE_AHORRO = gql`
  mutation CreateAhorro($monto: Float!, $fecha: String!, $personaId: ID, $descripcion: String) {
    createAhorro(monto: $monto, fecha: $fecha, personaId: $personaId, descripcion: $descripcion) {
      id
      monto
      fecha
      descripcion
      persona {
        id
        nombre
      }
    }
  }
`;

const DELETE_AHORRO = gql`
  mutation DeleteAhorro($id: ID!) {
    deleteAhorro(id: $id)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class AhorroService {

  constructor(private apollo: Apollo) { }

  getAhorros(mes?: number, anio?: number): Observable<Ahorro[]> {
    return this.apollo.watchQuery<any>({
      query: GET_AHORROS,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getAllAhorros)
    );
  }

  createAhorro(monto: number, fecha: string, personaId?: string, descripcion?: string): Observable<Ahorro> {
    return this.apollo.mutate<any>({
      mutation: CREATE_AHORRO,
      variables: { monto, fecha, personaId, descripcion },
      refetchQueries: [
        'GetAllAhorros',
        'GetGlobalBalance',
        'GetLastDates',
        'GetAllIngresos'
      ]
    }).pipe(
      map(result => result.data.createAhorro)
    );
  }

  deleteAhorro(id: string): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: DELETE_AHORRO,
      variables: { id },
      refetchQueries: [
        'GetAllAhorros',
        'GetGlobalBalance',
        'GetLastDates',
        'GetAllIngresos'
      ]
    }).pipe(
      map(result => result.data.deleteAhorro)
    );
  }
}
