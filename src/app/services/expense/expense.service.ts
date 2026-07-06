import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  tipo: 'GASTO' | 'INGRESO';
}

export interface Presupuesto {
  id: string;
  categoria: Categoria;
  monto: number;
  mes: number;
  anio: number;
}

export interface PagoCompartido {
  id: string;
  persona: { id: string; nombre: string };
  monto: number;
  formaPago?: string;
  fecha?: string;
}

export interface Gasto {
  id?: string;
  amount: number;
  categoria?: Categoria;
  date: string;
  description?: string;
  formaPago?: string;
  recurrent?: boolean;
  pagado?: boolean;
  fechaVencimiento?: string;
  fechaPago?: string;
  persona: any;
  esCompartido?: boolean;
  pagosCompartidos?: PagoCompartido[];
  cuotaActual?: number;
  cuotasTotales?: number;
}

const GET_GASTOS = gql`
  query GetAllGastos($mes: Int, $anio: Int) {
    getAllGastos(mes: $mes, anio: $anio) {
      id
      amount
      categoria {
        id
        nombre
        icono
      }
      date
      description
      formaPago
      recurrent
      pagado
      fechaVencimiento
      esCompartido
      cuotaActual
      cuotasTotales
      pagosCompartidos {
        id
        persona { id nombre }
        monto
        formaPago
        fecha
      }
      persona {
        id
        nombre
      }
    }
  }
`;

const GET_CATEGORIAS = gql`
  query GetCategorias($tipo: String) {
    getAllCategorias(tipo: $tipo) {
      id
      nombre
      icono
      tipo
    }
  }
`;

const GET_LAST_DATES = gql`
  query GetLastDates {
    getLastRecordsDates {
      lastGasto
      lastIngreso
      lastBalance
    }
  }
`;

const GET_GLOBAL_BALANCE = gql`
  query GetGlobalBalance($mes: Int, $anio: Int) {
    getGlobalBalance(mes: $mes, anio: $anio)
  }
`;

const CREATE_GASTO = gql`
  mutation CreateGasto($amount: Float!, $categoriaId: ID!, $date: String!, $description: String, $personaId: ID!, $formaPago: String, $recurrent: Boolean, $pagado: Boolean, $fechaVencimiento: String, $esCompartido: Boolean, $cuotaActual: Int, $cuotasTotales: Int) {
    createGasto(amount: $amount, categoriaId: $categoriaId, date: $date, description: $description, personaId: $personaId, formaPago: $formaPago, recurrent: $recurrent, pagado: $pagado, fechaVencimiento: $fechaVencimiento, esCompartido: $esCompartido, cuotaActual: $cuotaActual, cuotasTotales: $cuotasTotales) {
      id
      amount
      categoria {
        id
        nombre
        icono
      }
      date
      description
      formaPago
      recurrent
      pagado
      fechaVencimiento
      esCompartido
      cuotaActual
      cuotasTotales
      persona {
        id
        nombre
      }
    }
  }
`;

const UPDATE_GASTO = gql`
  mutation UpdateGasto($id: ID!, $amount: Float!, $categoriaId: ID!, $date: String!, $description: String, $personaId: ID!, $formaPago: String, $recurrent: Boolean, $pagado: Boolean, $fechaVencimiento: String, $esCompartido: Boolean, $cuotaActual: Int, $cuotasTotales: Int) {
    updateGasto(id: $id, amount: $amount, categoriaId: $categoriaId, date: $date, description: $description, personaId: $personaId, formaPago: $formaPago, recurrent: $recurrent, pagado: $pagado, fechaVencimiento: $fechaVencimiento, esCompartido: $esCompartido, cuotaActual: $cuotaActual, cuotasTotales: $cuotasTotales) {
      id
      amount
      categoria {
        id
        nombre
        icono
      }
      date
      description
      formaPago
      recurrent
      pagado
      fechaVencimiento
      esCompartido
      cuotaActual
      cuotasTotales
      persona {
        id
        nombre
      }
    }
  }
`;
const DESHACER_PAGO = gql`
  mutation DeshacerPago($id: ID!) {
    deshacerPago(id: $id) {
      id
      pagado
      fechaPago
      formaPago
    }
  }
`;

const CREATE_CATEGORIA = gql`
  mutation CreateCategoria($nombre: String!, $icono: String, $tipo: String!) {
    createCategoria(nombre: $nombre, icono: $icono, tipo: $tipo) {
      id
      nombre
      icono
      tipo
    }
  }
`;

const DELETE_CATEGORIA = gql`
  mutation DeleteCategoria($id: ID!) {
    deleteCategoria(id: $id)
  }
`;

const AGREGAR_PAGO_COMPARTIDO = gql`
  mutation AgregarPagoCompartido($gastoId: ID!, $personaId: ID!, $monto: Float!, $formaPago: String!, $fecha: String) {
    agregarPagoCompartido(gastoId: $gastoId, personaId: $personaId, monto: $monto, formaPago: $formaPago, fecha: $fecha) {
      id
      persona { id nombre }
      monto
      formaPago
      fecha
    }
  }
`;

const UPDATE_CATEGORIA = gql`
  mutation UpdateCategoria($id: ID!, $nombre: String, $icono: String, $tipo: String) {
    updateCategoria(id: $id, nombre: $nombre, icono: $icono, tipo: $tipo) {
      id
      nombre
      icono
      tipo
    }
  }
`;

const PAGAR_GASTO = gql`
  mutation PagarGasto($id: ID!, $monto: Float!, $personaId: ID!, $formaPago: String!, $fechaPago: String!) {
    pagarGasto(id: $id, monto: $monto, personaId: $personaId, formaPago: $formaPago, fechaPago: $fechaPago) {
      id
      amount
      pagado
      fechaPago
    }
  }
`;

const REINICIAR_DATOS = gql`
  mutation ReiniciarDatos {
    reiniciarDatos
  }
`;

const FINALIZE_MONTH = gql`
  mutation FinalizeMonth($mesActual: Int!, $anioActual: Int!) {
    finalizarMes(mesActual: $mesActual, anioActual: $anioActual)
  }
`;

const GENERAR_REPORTE = gql`
  query GenerarReporte($mes: Int!, $anio: Int!) {
    generarReporteMensual(mes: $mes, anio: $anio)
  }
`;

const GET_PRESUPUESTOS = gql`
  query GetPresupuestos($mes: Int!, $anio: Int!) {
    getPresupuestos(mes: $mes, anio: $anio) {
      id
      monto
      mes
      anio
      categoria {
        id
        nombre
        icono
        tipo
      }
    }
  }
`;

const SET_PRESUPUESTO = gql`
  mutation SetPresupuesto($categoriaId: ID!, $monto: Float!, $mes: Int!, $anio: Int!) {
    setPresupuesto(categoriaId: $categoriaId, monto: $monto, mes: $mes, anio: $anio) {
      id
      monto
      mes
      anio
      categoria {
        id
        nombre
        icono
        tipo
      }
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  constructor(private apollo: Apollo) { }

  getGastos(mes?: number, anio?: number): Observable<Gasto[]> {
    return this.apollo.watchQuery<any>({
      query: GET_GASTOS,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getAllGastos)
    );
  }

  getCategorias(tipo?: string): Observable<Categoria[]> {
    return this.apollo.watchQuery<any>({
      query: GET_CATEGORIAS,
      variables: { tipo },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getAllCategorias)
    );
  }

  getLastDates(): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: GET_LAST_DATES,
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getLastRecordsDates)
    );
  }

  getGlobalBalance(mes?: number, anio?: number): Observable<number> {
    return this.apollo.watchQuery<any>({
      query: GET_GLOBAL_BALANCE,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getGlobalBalance)
    );
  }

  createGasto(gasto: any): Observable<Gasto> {
    return this.apollo.mutate<any>({
      mutation: CREATE_GASTO,
      variables: {
        amount: gasto.amount,
        categoriaId: gasto.categoriaId,
        date: gasto.date,
        description: gasto.description,
        personaId: gasto.personaId,
        formaPago: gasto.formaPago,
        recurrent: gasto.recurrent,
        pagado: gasto.pagado || false,
        fechaVencimiento: gasto.fechaVencimiento,
        esCompartido: gasto.esCompartido || false,
        cuotaActual: gasto.cuotaActual,
        cuotasTotales: gasto.cuotasTotales
      },
      refetchQueries: [{ query: GET_GASTOS }, { query: GET_GLOBAL_BALANCE }, { query: GET_LAST_DATES }]
    }).pipe(
      map(result => result.data.createGasto)
    );
  }

  deshacerPago(id: string): Observable<Gasto> {
    return this.apollo.mutate<any>({
      mutation: DESHACER_PAGO,
      variables: { id },
      refetchQueries: [{ query: GET_GASTOS }, { query: GET_GLOBAL_BALANCE }, { query: GET_LAST_DATES }]
    }).pipe(
      map(result => result.data.deshacerPago)
    );
  }

  updateGasto(id: string, gasto: any): Observable<Gasto> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_GASTO,
      variables: {
        id,
        amount: gasto.amount,
        categoriaId: gasto.categoriaId,
        date: gasto.date,
        description: gasto.description,
        personaId: gasto.personaId,
        formaPago: gasto.formaPago,
        recurrent: gasto.recurrent,
        pagado: gasto.pagado || false,
        fechaVencimiento: gasto.fechaVencimiento,
        esCompartido: gasto.esCompartido || false,
        cuotaActual: gasto.cuotaActual,
        cuotasTotales: gasto.cuotasTotales
      },
      refetchQueries: [{ query: GET_GASTOS }, { query: GET_GLOBAL_BALANCE }, { query: GET_LAST_DATES }]
    }).pipe(
      map(result => result.data.updateGasto)
    );
  }

  createCategoria(cat: any): Observable<Categoria> {
    return this.apollo.mutate<any>({
      mutation: CREATE_CATEGORIA,
      variables: {
        nombre: cat.nombre,
        icono: cat.icono,
        tipo: cat.tipo
      },
      refetchQueries: [{ query: GET_CATEGORIAS }]
    }).pipe(
      map(result => result.data.createCategoria)
    );
  }

  deleteCategoria(id: string): Observable<boolean> {
    console.log('>>> ExpenseService: Enviando mutación DELETE para ID:', id);
    return this.apollo.mutate<any>({
      mutation: DELETE_CATEGORIA,
      variables: { id },
      refetchQueries: [{ query: GET_CATEGORIAS }]
    }).pipe(
      map(result => {
        console.log('>>> ExpenseService: Resultado DELETE:', result.data.deleteCategoria);
        return result.data.deleteCategoria;
      })
    );
  }

  updateCategoria(id: string, cat: any): Observable<Categoria> {
    console.log('>>> ExpenseService: Enviando mutación UPDATE para ID:', id, cat);
    return this.apollo.mutate<any>({
      mutation: UPDATE_CATEGORIA,
      variables: {
        id,
        nombre: cat.nombre,
        icono: cat.icono,
        tipo: cat.tipo
      },
      refetchQueries: [{ query: GET_CATEGORIAS }]
    }).pipe(
      map(result => {
        console.log('>>> ExpenseService: Resultado UPDATE:', result.data.updateCategoria);
        return result.data.updateCategoria;
      })
    );
  }

  agregarPagoCompartido(gastoId: string, personaId: string, monto: number, formaPago: string, fecha: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: AGREGAR_PAGO_COMPARTIDO,
      variables: { gastoId, personaId, monto, formaPago, fecha },
      refetchQueries: [{ query: GET_GASTOS }, { query: GET_GLOBAL_BALANCE }, { query: GET_LAST_DATES }]
    }).pipe(
      map(result => result.data.agregarPagoCompartido)
    );
  }

  markAsPaid(paymentData: any): Observable<Gasto> {
    return this.apollo.mutate<any>({
      mutation: PAGAR_GASTO,
      variables: {
        id: paymentData.id,
        monto: paymentData.amount,
        personaId: paymentData.personaId,
        formaPago: paymentData.formaPago,
        fechaPago: paymentData.fechaPago
      },
      refetchQueries: ['GetAllGastos', 'GetGlobalBalance', 'GetLastDates']
    }).pipe(
      map(result => result.data.pagarGasto)
    );
  }

  resetData(): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: REINICIAR_DATOS,
      refetchQueries: ['GetAllGastos', 'GetAllIngresos', 'GetGlobalBalance', 'GetLastDates']
    }).pipe(
      map(result => result.data.reiniciarDatos)
    );
  }

  finalizeMonth(mesActual: number, anioActual: number): Observable<boolean> {
    return this.apollo.mutate<any>({
      mutation: FINALIZE_MONTH,
      variables: { mesActual, anioActual },
      refetchQueries: ['GetAllGastos', 'GetAllIngresos', 'GetGlobalBalance', 'GetLastDates']
    }).pipe(
      map(result => result.data.finalizarMes)
    );
  }

  generarReporteMensual(mes: number, anio: number): Observable<string> {
    return this.apollo.query<any>({
      query: GENERAR_REPORTE,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data.generarReporteMensual)
    );
  }

  getPresupuestos(mes?: number, anio?: number): Observable<Presupuesto[]> {
    return this.apollo.watchQuery<any>({
      query: GET_PRESUPUESTOS,
      variables: { mes, anio },
      fetchPolicy: 'network-only'
    }).valueChanges.pipe(
      map(result => result.data.getPresupuestos)
    );
  }

  setPresupuesto(categoriaId: string, monto: number, mes: number, anio: number): Observable<Presupuesto> {
    return this.apollo.mutate<any>({
      mutation: SET_PRESUPUESTO,
      variables: { categoriaId, monto, mes, anio },
      refetchQueries: [{ query: GET_PRESUPUESTOS, variables: { mes, anio } }]
    }).pipe(
      map(result => result.data.setPresupuesto)
    );
  }
}
