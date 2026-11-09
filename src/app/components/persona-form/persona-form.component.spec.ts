import { moduloDePrueba } from 'src/testing/modulo-de-prueba';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonaFormComponent } from './persona-form.component';

describe('PersonaFormComponent', () => {
  let component: PersonaFormComponent;
  let fixture: ComponentFixture<PersonaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(moduloDePrueba([PersonaFormComponent]))
    .compileComponents();

    fixture = TestBed.createComponent(PersonaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
