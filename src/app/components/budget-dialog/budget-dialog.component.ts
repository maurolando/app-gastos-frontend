import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Categoria, ExpenseService, Presupuesto } from '../../services/expense/expense.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-budget-dialog',
  templateUrl: './budget-dialog.component.html',
  styleUrls: ['./budget-dialog.component.scss']
})
export class BudgetDialogComponent implements OnInit {

  categorias: Categoria[] = [];
  presupuestos: Presupuesto[] = [];
  budgetMap: { [key: string]: number } = {};
  mes: number;
  anio: number;

  constructor(
    public dialogRef: MatDialogRef<BudgetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private expenseService: ExpenseService,
    private notify: NotificationService
  ) {
    this.mes = data.mes;
    this.anio = data.anio;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // 1. Cargar las categorías de tipo GASTO
    this.expenseService.getCategorias('GASTO').subscribe({
      next: (cats) => {
        this.categorias = cats;
        // 2. Cargar presupuestos para el mes y año
        this.expenseService.getPresupuestos(this.mes, this.anio).subscribe({
          next: (presupuestos) => {
            this.presupuestos = presupuestos;
            // Llenar el mapa
            this.categorias.forEach(cat => {
              const p = this.presupuestos.find(pr => pr.categoria?.id === cat.id);
              this.budgetMap[cat.id] = p ? p.monto : 0;
            });
          },
          error: (err) => {
            this.notify.error('Error al cargar presupuestos');
            console.error(err);
          }
        });
      },
      error: (err) => {
        this.notify.error('Error al cargar categorías');
        console.error(err);
      }
    });
  }

  guardar(categoriaId: string): void {
    const monto = this.budgetMap[categoriaId];
    if (monto === undefined || monto < 0) {
      this.notify.error('Monto inválido');
      return;
    }

    this.expenseService.setPresupuesto(categoriaId, monto, this.mes, this.anio).subscribe({
      next: (res) => {
        this.notify.success('Presupuesto actualizado');
      },
      error: (err) => {
        this.notify.error('Error al actualizar presupuesto');
        console.error(err);
      }
    });
  }

  close(): void {
    this.dialogRef.close(true); // Retorna true si hubo cambios (podríamos rastrearlo mejor, pero esto recargará la vista principal)
  }
}
