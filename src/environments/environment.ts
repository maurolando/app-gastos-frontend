/**
 * Configuración de producción (la que usa `ng build` sin flags).
 *
 * `apiUrl` tiene que apuntar al backend desplegado y por HTTPS: una PWA solo se
 * instala sobre HTTPS, y un navegador en una página HTTPS bloquea las llamadas
 * a HTTP por contenido mixto.
 *
 * Render le agregó el sufijo -1a1r al nombre del servicio porque
 * app-gastos-backend ya estaba tomado. Si alguna vez se recrea el servicio y
 * cambia el nombre, este es el único lugar donde hay que tocarlo.
 */
export const environment = {
  production: true,
  apiUrl: 'https://app-gastos-backend-1a1r.onrender.com/graphql'
};
