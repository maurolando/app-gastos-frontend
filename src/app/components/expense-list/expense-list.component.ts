import { Component, OnInit } from '@angular/core';
import { ExpenseService, Gasto } from 'src/app/services/expense/expense.service';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { SharedPaymentDialogComponent } from '../shared-payment-dialog/shared-payment-dialog.component';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit {
  displayedColumns: string[] = ['date', 'persona', 'category', 'description', 'amount', 'acciones'];
  gastos$!: Observable<Gasto[]>;

  constructor(private service: ExpenseService, private dialog: MatDialog) {}

  ngOnInit() {
    this.gastos$ = this.service.getGastos();
  }

  openAddExpense() {
    this.dialog.open(ExpenseFormComponent, { width: '450px' });
  }

  openSharedPayment(gasto: Gasto) {
    this.dialog.open(SharedPaymentDialogComponent, {
      width: '520px',
      data: gasto
    });
  }

  getPorcentaje(gasto: Gasto): number {
    if (!gasto.pagosCompartidos?.length) return 0;
    const totalPagado = gasto.pagosCompartidos.reduce((acc, p) => acc + p.monto, 0);
    return Math.min(100, (totalPagado / gasto.amount) * 100);
  }
}

