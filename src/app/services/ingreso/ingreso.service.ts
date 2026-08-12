import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { Persona } from '../persona/persona.service';
import { Categoria } from '../expense/expense.service';

export interface Ingreso {
  id?: string;
  monto: number;
  fecha: string;
  categoria: Categoria;
  recurrent?: boolean;
  persona: Persona;
}

const GET_INGRESOS = gql`
  query GetAllIngresos($mes: Int, $anio: Int) {
    getAllIngresos(mes: $mes, anio: $anio) {
      id
      monto
      fecha
      categoria {
        id
        nombre
        icono
      }
      recurrent
      persona {
        id
        nombre
      }
    }
  }
`;

const CREATE_INGRESO = gql`
  mutation CreateIngreso($monto: Float!, $fecha: String!, $categoriaId: ID!, $personaId: ID!, $recurrent: Boolean) {
    createIngreso(monto: $monto, fecha: $fecha, categoriaId: $categoriaId, personaId: $personaId, recurrent: $recurrent) {
      id
      monto
      fecha
      categoria {
        id
        nombre
        icono
      }
      recurrent
      persona {
        id
        nombre
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class IngresoService {

  constructor(private apollo: Apollo) { }

  getIngresos(mes?: number, anio?: number): Observable<Ingreso[]> {
    return this.apollo.watchQuery<any>({
      query: GET_INGRESOS,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getAllIngresos)
    );
  }

  createIngreso(monto: number, fecha: string, categoriaId: string, personaId: string, recurrent: boolean): Observable<Ingreso> {
    return this.apollo.mutate<any>({
      mutation: CREATE_INGRESO,
      variables: { monto, fecha, categoriaId, personaId, recurrent },
      refetchQueries: ['GetAllIngresos', 'GetGlobalBalance', 'GetLastDates']
    }).pipe(
      map(result => result.data.createIngreso)
    );
  }
}
