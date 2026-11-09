import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { moduloDePrueba } from 'src/testing/modulo-de-prueba';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    const modulo = moduloDePrueba([AppComponent]);
    // La app pide SwUpdate para avisar de versiones nuevas; en el test va apagado.
    modulo.imports!.push(ServiceWorkerModule.register('', { enabled: false }));
    await TestBed.configureTestingModule(modulo).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // La barra superior aparece después de navegar, salvo en el login.
  async function renderEn(url: string): Promise<HTMLElement> {
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: '**', children: [] }]);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await router.navigateByUrl(url);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el nombre de la app en la barra superior', async () => {
    const pagina = await renderEn('/gastos');
    expect(pagina.querySelector('.app-title')?.textContent).toContain('Gastos Hogar');
  });

  it('no muestra la barra superior en el login', async () => {
    const pagina = await renderEn('/login');
    expect(pagina.querySelector('.main-toolbar')).toBeNull();
  });
});
