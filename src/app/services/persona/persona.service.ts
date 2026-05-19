import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

export interface Persona {
  id?: string;
  nombre: string;
  creadoEn?: string;
  activo?: boolean;
  tieneClave?: boolean;
}

const GET_PERSONAS = gql`
  query GetAllPersonas {
    getAllPersonas {
      id
      nombre
      creadoEn
      activo
    }
  }
`;

const CREATE_PERSONA = gql`
  mutation CreatePersona($nombre: String!) {
    createPersona(nombre: $nombre) {
      id
      nombre
      creadoEn
      activo
    }
  }
`;

const UPDATE_PERSONA = gql`
  mutation UpdatePersona($id: ID!, $nombre: String, $activo: Boolean) {
    updatePersona(id: $id, nombre: $nombre, activo: $activo) {
      id
      nombre
      creadoEn
      activo
      tieneClave
    }
  }
`;

const LOGIN_PERSONA = gql`
  mutation Login($nombre: String!, $clave: String!) {
    login(nombre: $nombre, clave: $clave) {
      id
      nombre
      activo
      tieneClave
    }
  }
`;

const SET_CLAVE = gql`
  mutation SetClave($id: ID!, $clave: String!) {
    setClave(id: $id, clave: $clave) {
      id
      nombre
      tieneClave
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class PersonaService {

  constructor(private apollo: Apollo) { }

  getPersonas(): Observable<Persona[]> {
    return this.apollo.watchQuery<any>({
      query: GET_PERSONAS
    }).valueChanges.pipe(
      map(result => result.data.getAllPersonas)
    );
  }

  createPersona(nombre: string): Observable<Persona> {
    return this.apollo.mutate<any>({
      mutation: CREATE_PERSONA,
      variables: { nombre },
      refetchQueries: [{ query: GET_PERSONAS }]
    }).pipe(
      map(result => result.data.createPersona)
    );
  }

  updatePersona(id: string, nombre?: string, activo?: boolean): Observable<Persona> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_PERSONA,
      variables: { id, nombre, activo },
      refetchQueries: [{ query: GET_PERSONAS }]
    }).pipe(
      map(result => result.data.updatePersona)
    );
  }

  loginPersona(nombre: string, clave: string): Observable<Persona | null> {
    return this.apollo.mutate<any>({
      mutation: LOGIN_PERSONA,
      variables: { nombre, clave }
    }).pipe(
      map(result => result.data.login)
    );
  }

  setClave(id: string, clave: string): Observable<Persona> {
    return this.apollo.mutate<any>({
      mutation: SET_CLAVE,
      variables: { id, clave }
    }).pipe(
      map(result => result.data.setClave)
    );
  }
}
