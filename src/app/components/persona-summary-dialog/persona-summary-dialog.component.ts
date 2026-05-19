import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ExpenseService, Gasto } from 'src/app/services/expense/expense.service';
import { Persona } from 'src/app/services/persona/persona.service';

@Component({
  selector: 'app-persona-summary-dialog',
  templateUrl: './persona-summary-dialog.component.html',
  styleUrls: ['./persona-summary-dialog.component.scss']
})
export class PersonaSummaryDialogComponent implements OnInit {
  summary$!: Observable<any>;

  constructor(
    private expenseService: ExpenseService,
    public dialogRef: MatDialogRef<PersonaSummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Persona
  ) {}

  ngOnInit() {
    // Obtenemos todos los gastos y filtramos por la persona
    this.summary$ = this.expenseService.getGastos().pipe(
      map(allGastos => {
        const myGastos = allGastos.filter(g => g.persona?.id === this.data.id && g.pagado);
        
        if (myGastos.length === 0) {
          return { 
            totalAmount: 0, 
            favoritePaymentMethod: 'N/A', 
            topCategory: 'N/A', 
            categoryBreakdown: [], 
            recentExpenses: [] 
          };
        }

        const totalAmount = myGastos.reduce((acc, g) => acc + g.amount, 0);
        
        // Método de pago favorito
        const paymentMethods = myGastos.map(g => g.formaPago || 'Otros');
        const favMethod = this.getMostFrequent(paymentMethods);

        // Desglose por categoría
        const categoriesMap = new Map<string, any>();
        myGastos.forEach(g => {
          const catName = g.categoria?.nombre || 'Sin Categoría';
          const current = categoriesMap.get(catName) || { 
            nombre: catName, 
            total: 0, 
            count: 0, 
            icono: g.categoria?.icono || 'category'
          };
          current.total += g.amount;
          current.count += 1;
          categoriesMap.set(catName, current);
        });

        const categoryBreakdown = Array.from(categoriesMap.values()).sort((a, b) => b.total - a.total);
        const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].nombre : 'N/A';

        return {
          totalAmount,
          favoritePaymentMethod: favMethod,
          topCategory,
          categoryBreakdown,
          recentExpenses: myGastos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
        };
      })
    );
  }

  private getMostFrequent(arr: string[]): string {
    const counts = arr.reduce((acc: any, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}
