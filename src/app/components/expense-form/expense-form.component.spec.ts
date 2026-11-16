import { moduloDePrueba } from 'src/testing/modulo-de-prueba';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseFormComponent } from './expense-form.component';

describe('ExpenseFormComponent', () => {
  let component: ExpenseFormComponent;
  let fixture: ComponentFixture<ExpenseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(moduloDePrueba([ExpenseFormComponent]))
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cierra con una X arriba y guarda con un botón ancho abajo', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button[aria-label="Cancelar"][mat-dialog-close]')).not.toBeNull();
    expect(el.querySelector('mat-dialog-actions button.guardar-ancho')).not.toBeNull();
    expect(el.querySelectorAll('mat-dialog-actions button').length).toBe(1);
  });

  // La X quedó primera en el DOM: sin esto el diálogo enfocaría la X y no el monto.
  it('arranca con el foco en el monto', () => {
    expect(fixture.nativeElement.querySelector('input[formcontrolname="amount"][cdkfocusinitial]')).not.toBeNull();
  });
});
