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

/** Lo que devuelve la mutation login: el token de sesion y la persona. */
export interface LoginResult {
  token: string;
  persona: Persona;
}

const LOGIN_PERSONA = gql`
  mutation Login($nombre: String!, $clave: String!) {
    login(nombre: $nombre, clave: $clave) {
      token
      persona {
        id
        nombre
        activo
        tieneClave
      }
    }
  }
`;

const CREAR_INVITACION = gql`
  mutation CrearInvitacion {
    crearInvitacion {
      codigo
      expiraEn
    }
  }
`;

export interface Invitacion {
  codigo: string;
  expiraEn: string;
}

const REGISTRAR = gql`
  mutation Registrar($nombre: String!, $clave: String!, $codigoInvitacion: String) {
    registrar(nombre: $nombre, clave: $clave, codigoInvitacion: $codigoInvitacion) {
      token
      persona {
        id
        nombre
        activo
        tieneClave
      }
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

  getPersonas(pollInterval?: number): Observable<Persona[]> {
    return this.apollo.watchQuery<any>({
      query: GET_PERSONAS,
      pollInterval
    }).valueChanges.pipe(
      map(result => result.data.getAllPersonas)
    );
  }

  createPersona(nombre: string): Observable<Persona> {
    return this.apollo.mutate<any>({
      mutation: CREATE_PERSONA,
      variables: { nombre },
      refetchQueries: ['GetAllPersonas']
    }).pipe(
      map(result => result.data.createPersona)
    );
  }

  updatePersona(id: string, nombre?: string, activo?: boolean): Observable<Persona> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_PERSONA,
      variables: { id, nombre, activo },
      refetchQueries: ['GetAllPersonas']
    }).pipe(
      map(result => result.data.updatePersona)
    );
  }

  loginPersona(nombre: string, clave: string): Observable<LoginResult | null> {
    return this.apollo.mutate<any>({
      mutation: LOGIN_PERSONA,
      variables: { nombre, clave }
    }).pipe(
      map(result => result.data.login)
    );
  }

  /**
   * Crea una cuenta nueva y devuelve la sesión ya iniciada. Sin código arma un hogar
   * vacío; con un código de invitación se suma al hogar que lo generó (issue #35).
   */
  registrar(nombre: string, clave: string, codigoInvitacion?: string | null): Observable<LoginResult> {
    return this.apollo.mutate<any>({
      mutation: REGISTRAR,
      variables: { nombre, clave, codigoInvitacion: codigoInvitacion || null }
    }).pipe(
      map(result => result.data.registrar)
    );
  }

  /** Código de un solo uso (vence en 48 h) para sumar a alguien a este hogar. */
  crearInvitacion(): Observable<Invitacion> {
    return this.apollo.mutate<any>({ mutation: CREAR_INVITACION }).pipe(
      map(result => result.data.crearInvitacion)
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
