import { Component } from '@angular/core';
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
export class AppComponent {
  currentUser$ = this.auth.currentUser$;
  isLoginPage$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(e => (e as NavigationEnd).urlAfterRedirects === '/login')
  );

  constructor(
    private expenseService: ExpenseService,
    private auth: AuthService,
    private notify: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

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
        message: 'Esta acción borrará TODOS los gastos e ingresos registrados en toda la aplicación. No se puede deshacer.'
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
