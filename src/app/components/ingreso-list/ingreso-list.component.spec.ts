import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoListComponent } from './ingreso-list.component';

describe('IngresoListComponent', () => {
  let component: IngresoListComponent;
  let fixture: ComponentFixture<IngresoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IngresoListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngresoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
