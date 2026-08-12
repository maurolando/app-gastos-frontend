/**
 * Configuración de producción (la que usa `ng build` sin flags).
 *
 * `apiUrl` tiene que apuntar al backend desplegado y por HTTPS: una PWA solo se
 * instala sobre HTTPS, y un navegador en una página HTTPS bloquea las llamadas
 * a HTTP por contenido mixto.
 *
 * Si el servicio de Render quedó con otro nombre, este es el único lugar donde
 * hay que cambiarlo.
 */
export const environment = {
  production: true,
  apiUrl: 'https://app-gastos-backend.onrender.com/graphql'
};
