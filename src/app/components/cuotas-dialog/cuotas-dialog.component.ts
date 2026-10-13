import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExpenseService, Gasto, ResumenCuotas } from 'src/app/services/expense/expense.service';

/**
 * Estado de una compra en cuotas, vista desde cualquiera de sus cuotas.
 *
 * Los numeros los calcula el backend: las cuotas de una compra son gastos
 * sueltos, uno por mes, y juntarlas es cosa suya. Aca solo se muestran.
 */
@Component({
  selector: 'app-cuotas-dialog',
  templateUrl: './cuotas-dialog.component.html',
  styleUrls: ['./cuotas-dialog.component.scss']
})
export class CuotasDialogComponent implements OnInit {
  resumen$!: Observable<ResumenCuotas>;
  porcentaje$!: Observable<number>;

  constructor(
    private expenseService: ExpenseService,
    @Inject(MAT_DIALOG_DATA) public gasto: Gasto
  ) {}

  ngOnInit() {
    this.resumen$ = this.expenseService.getResumenCuotas(this.gasto.id!);
    this.porcentaje$ = this.resumen$.pipe(
      map(r => r.totalAPagar > 0 ? (r.totalPagado / r.totalAPagar) * 100 : 0)
    );
  }
}
