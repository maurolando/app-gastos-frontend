import { moduloDePrueba } from 'src/testing/modulo-de-prueba';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AhorrosComponent } from './ahorros.component';

describe('AhorrosComponent', () => {
  let component: AhorrosComponent;
  let fixture: ComponentFixture<AhorrosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(moduloDePrueba([AhorrosComponent]))
    .compileComponents();

    fixture = TestBed.createComponent(AhorrosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
