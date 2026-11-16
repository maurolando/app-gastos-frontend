import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { moduloDePrueba } from 'src/testing/modulo-de-prueba';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AppComponent } from './app.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { LayoutService } from './services/layout/layout.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const modulo = moduloDePrueba([AppComponent]);
    // La app pide SwUpdate para avisar de versiones nuevas; en el test va apagado.
    modulo.imports!.push(ServiceWorkerModule.register('', { enabled: false }));
    // El sidenav real: el FAB depende de sidenav.opened.
    modulo.imports!.push(MatSidenavModule);
    await TestBed.configureTestingModule(modulo).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // La barra superior aparece después de navegar, salvo en el login.
  let fixtureActual: any;
  async function renderEn(url: string): Promise<HTMLElement> {
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: '**', children: [] }]);
    const fixture = TestBed.createComponent(AppComponent);
    fixtureActual = fixture;
    fixture.detectChanges();
    await router.navigateByUrl(url);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el nombre de la app en la barra superior', async () => {
    const pagina = await renderEn('/gastos');
    expect(pagina.querySelector('.app-title')?.textContent).toContain('Expns');
  });

  it('no muestra la barra superior en el login', async () => {
    const pagina = await renderEn('/login');
    expect(pagina.querySelector('.main-toolbar')).toBeNull();
  });

  it('nuevoGasto abre el formulario de gasto', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const dialog = TestBed.inject(MatDialog);
    spyOn(dialog, 'open');
    fixture.componentInstance.nuevoGasto();
    expect(dialog.open).toHaveBeenCalledWith(ExpenseFormComponent, { width: '450px' });
  });

  // Con el menú abierto, la esquina del FAB es donde se toca para cerrarlo.
  it('en el celular muestra el FAB salvo con el menú abierto', async () => {
    TestBed.overrideProvider(AuthService, { useValue: { currentUser$: new BehaviorSubject({ nombre: 'ANA' }) } });
    TestBed.overrideProvider(LayoutService, { useValue: { esMovil$: of(true), esMovil: true } });
    const pagina = await renderEn('/gastos');
    expect(pagina.querySelector('.fab-gasto')).not.toBeNull();
    (pagina.querySelector('button[aria-label="Abrir menú"]') as HTMLElement).click();
    await new Promise(r => setTimeout(r));
    fixtureActual.detectChanges();
    expect(pagina.querySelector('.fab-gasto')).toBeNull();
  });
});
