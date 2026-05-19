import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

export interface Compra {
  id?: string;
  nombre: string;
  precio: number;
  lugar: string;
  comprado: boolean;
  fechaRegistro: string;
}

const GET_SHOPPING_LIST = gql`
  query GetShoppingList {
    getShoppingList {
      id
      nombre
      precio
      lugar
      comprado
      fechaRegistro
    }
  }
`;

const CREATE_SHOPPING_ITEM = gql`
  mutation CreateShoppingItem($nombre: String!, $precio: Float, $lugar: String) {
    createShoppingItem(nombre: $nombre, precio: $precio, lugar: $lugar) {
      id
      nombre
      precio
      lugar
      comprado
      fechaRegistro
    }
  }
`;

const TOGGLE_SHOPPING_ITEM = gql`
  mutation ToggleShoppingItemStatus($id: ID!) {
    toggleShoppingItemStatus(id: $id) {
      id
      comprado
    }
  }
`;

const DELETE_SHOPPING_ITEM = gql`
  mutation DeleteShoppingItem($id: ID!) {
    deleteShoppingItem(id: $id)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ShoppingService {

  constructor(private apollo: Apollo) { }

  getShoppingList(): Observable<Compra[]> {
    return this.apollo.watchQuery<any>({
      query: GET_SHOPPING_LIST,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getShoppingList)
    );
  }

  createShoppingItem(nombre: string, precio: number, lugar: string): Observable<Compra> {
    return this.apollo.mutate<any>({
      mutation: CREATE_SHOPPING_ITEM,
      variables: { nombre, precio, lugar },
      refetchQueries: ['GetShoppingList']
    }).pipe(
      map(result => result.data.createShoppingItem)
    );
  }

  toggleShoppingItem(id: string): Observable<Compra> {
    return this.apollo.mutate<any>({
      mutation: TOGGLE_SHOPPING_ITEM,
      variables: { id }
    }).pipe(
      map(result => result.data.toggleShoppingItemStatus)
    );
  }

  deleteShoppingItem(id: string): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: DELETE_SHOPPING_ITEM,
      variables: { id },
      refetchQueries: ['GetShoppingList']
    }).pipe(
      map(result => result.data.deleteShoppingItem)
    );
  }
}
