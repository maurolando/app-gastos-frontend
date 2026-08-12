import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ExpenseService } from './services/expense/expense.service';
import { AuthService } from './services/auth/auth.service';
import { NotificationService } from './services/notification/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

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

  isOnline = false;
  private connectionIntervalId: any;

  constructor(
    private expenseService: ExpenseService,
    private auth: AuthService,
    private notify: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
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
      const response = await fetch('http://localhost:8080/graphql', {
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
    this.notify.success('Sesión cerrada');
    this.router.navigate(['/login']);
  }

  resetData() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '⚠️ ¿ESTÁS SEGURO?',
        // El mensaje no mencionaba los ahorros, que reiniciarDatos también borra.
        message: 'Esta acción borrará TODOS los gastos, ingresos y ahorros de la '
          + 'aplicación, de todos los meses. No se puede deshacer.\n\n'
          + 'Si querés corregir un gasto puntual, editalo o borralo desde la lista de Gastos.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.resetData().subscribe({
          next: (success) => {
            if (success) {
              this.notify.success('Datos reiniciados con éxito');
              window.location.reload();
            } else {
              this.notify.error('Error al reiniciar los datos. Revisa el backend.');
            }
          },
          error: (err) => {
            console.error('Error en resetData:', err);
            this.notify.error('Ocurrió un error de red o de GraphQL. Mira la consola.');
          }
        });
      }
    });
  }
}
