import { Component, OnInit } from '@angular/core';
import { IngresoService, Ingreso } from 'src/app/services/ingreso/ingreso.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IngresoFormComponent } from '../ingreso-form/ingreso-form.component';

@Component({
  selector: 'app-ingreso-list',
  templateUrl: './ingreso-list.component.html',
  styleUrls: ['./ingreso-list.component.scss']
})
export class IngresoListComponent implements OnInit {
  displayedColumns: string[] = ['fecha', 'persona', 'tipo', 'monto'];
  ingresos$!: Observable<Ingreso[]>;

  constructor(private service: IngresoService, private dialog: MatDialog) {}

  ngOnInit() {
    this.ingresos$ = this.service.getIngresos();
  }

  openAddIngreso() {
    this.dialog.open(IngresoFormComponent, {
      width: '450px'
    });
  }
}
