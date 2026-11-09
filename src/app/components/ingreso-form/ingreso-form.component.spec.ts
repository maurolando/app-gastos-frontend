import { moduloDePrueba } from 'src/testing/modulo-de-prueba';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoFormComponent } from './ingreso-form.component';

describe('IngresoFormComponent', () => {
  let component: IngresoFormComponent;
  let fixture: ComponentFixture<IngresoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(moduloDePrueba([IngresoFormComponent]))
    .compileComponents();

    fixture = TestBed.createComponent(IngresoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
