import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { MatSidenav } from '@angular/material/sidenav';
import { Apollo } from 'apollo-angular';
import { LayoutService } from './services/layout/layout.service';
import { AuthService } from './services/auth/auth.service';
import { NotificationService } from './services/notification/notification.service';
import { environment } from 'src/environments/environment';
import { ActualizacionService } from './services/pwa/actualizacion.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  currentUser$ = this.auth.currentUser$;
  isLoginPage$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(e => (e as NavigationEnd).urlAfterRedirects === '/login')
  );

  /**
   * Por debajo del corte el sidenav fijo tapaba la pantalla entera: pasa a
   * superponerse al contenido y arranca cerrado.
   */
  esMovil$ = this.layout.esMovil$;

  /**
   * Safari en iPhone/iPad no ofrece instalar la app como Chrome: hay que hacerlo
   * a mano desde Compartir, así que lo explicamos (#49). iPadOS se presenta como Mac.
   */
  instalableEnIos = (/iPhone|iPad|iPod/.test(navigator.userAgent)
      || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
    && !matchMedia('(display-mode: standalone)').matches;

  isOnline = false;
  private connectionIntervalId: any;

  constructor(
    private auth: AuthService,
    private notify: NotificationService,
    private router: Router,
    private layout: LayoutService,
    private actualizacion: ActualizacionService,
    private apollo: Apollo
  ) {}

  /**
   * En móvil el sidenav se superpone al contenido, así que hay que cerrarlo
   * después de navegar o queda tapando la pantalla a la que acabás de entrar.
   */
  cerrarSiEsMovil(sidenav: MatSidenav) {
    if (this.layout.esMovil) {
      sidenav.close();
    }
  }

  explicarInstalacionIos() {
    this.notify.action(
      'Para instalarla, abrí el menú Compartir de Safari y elegí "Agregar a inicio".',
      'Entendido'
    );
  }

  ngOnInit() {
    this.actualizacion.iniciar();
    this.checkConnection();
    // Check connection every 5 seconds
    this.connectionIntervalId = setInterval(() => {
      this.checkConnection();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.connectionIntervalId) {
      clearInterval(this.connectionIntervalId);
    }
  }

  async checkConnection() {
    try {
      const response = await fetch(environment.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' })
      });
      
      const previousState = this.isOnline;
      this.isOnline = response.ok;

      // Optional: notify when status changes
      if (previousState !== this.isOnline) {
        if (this.isOnline) {
          this.notify.success('Conexión con el servidor restablecida');
        } else {
          this.notify.error('Se ha perdido la conexión con el servidor');
        }
      }
    } catch (error) {
      const previousState = this.isOnline;
      this.isOnline = false;
      if (previousState !== this.isOnline) {
        this.notify.error('Se ha perdido la conexión con el servidor');
      }
    }
  }

  logout() {
    this.auth.cerrarSesion();
    // Sin esto, la próxima cuenta que entre en este navegador ve por un momento los datos de esta.
    this.apollo.client.clearStore();
    this.notify.success('Sesión cerrada');
    this.router.navigate(['/login']);
  }
}
