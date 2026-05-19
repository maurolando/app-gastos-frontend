import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExpenseService, Gasto } from 'src/app/services/expense/expense.service';
import { IngresoService } from 'src/app/services/ingreso/ingreso.service';
import { Observable, combineLatest, map, startWith, switchMap, Subject, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { SharedPaymentDialogComponent } from '../shared-payment-dialog/shared-payment-dialog.component';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

const STORAGE_MONTH_KEY = 'dashboard_selectedMonth';
const STORAGE_YEAR_KEY = 'dashboard_selectedYear';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Restore last selected month/year from localStorage, or default to current
  monthControl = new FormControl(
    Number(localStorage.getItem(STORAGE_MONTH_KEY)) || new Date().getMonth() + 1
  );
  yearControl = new FormControl(
    Number(localStorage.getItem(STORAGE_YEAR_KEY)) || new Date().getFullYear()
  );

  totalExpenses$!: Observable<number>;
  totalIncome$!: Observable<number>;
  balance$!: Observable<number>;
  count$!: Observable<number>;
  pendingExpenses$!: Observable<Gasto[]>;
  lastDates$!: Observable<any>;



  // Chart Data
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#e2e8f0' } }
    }
  };
  public pieChartData$!: Observable<ChartData<'pie', number[], string | string[]>>;
  public pieChartType: ChartType = 'pie';

  years = [2024, 2025, 2026, 2027];
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  constructor(
    private expenseService: ExpenseService,
    private ingresoService: IngresoService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    // Persist selection in localStorage whenever user changes it
    this.monthControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v != null) localStorage.setItem(STORAGE_MONTH_KEY, String(v));
    });
    this.yearControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(v => {
      if (v != null) localStorage.setItem(STORAGE_YEAR_KEY, String(v));
    });

    const filter$ = combineLatest([
      this.monthControl.valueChanges.pipe(startWith(this.monthControl.value)),
      this.yearControl.valueChanges.pipe(startWith(this.yearControl.value))
    ]);

    const data$ = filter$.pipe(
      switchMap(([month, year]) => {
        const m = month || undefined;
        const y = year || undefined;
        return combineLatest([
          this.expenseService.getGastos(m, y),
          this.ingresoService.getIngresos(m, y),
          this.expenseService.getGlobalBalance(m, y)
        ]);
      })
    );

    this.totalExpenses$ = data$.pipe(
      map(([gastos]) => gastos
        .filter(g => g.pagado) // Solo sumamos lo pagado al total visual
        .reduce((acc, g) => acc + g.amount, 0))
    );
    this.totalIncome$ = data$.pipe(map(([_, ingresos]) => ingresos.reduce((acc, i) => acc + i.monto, 0)));
    this.balance$ = data$.pipe(map(([_, __, balance]) => balance));
    this.count$ = data$.pipe(map(([gastos]) => gastos.length));
    
    this.lastDates$ = this.expenseService.getLastDates();
    
    // Gastos pendientes: recurrentes no pagados + compartidos no completamente pagados
    this.pendingExpenses$ = data$.pipe(
      map(([gastos]) => gastos.filter(g => !g.pagado))
    );



    this.pieChartData$ = data$.pipe(
      map(([gastos]) => {
        const groups: { [key: string]: number } = {};
        gastos.forEach(g => {
          const method = g.formaPago || 'Otros';
          groups[method] = (groups[method] || 0) + g.amount;
        });

        return {
          labels: Object.keys(groups),
          datasets: [{
            data: Object.values(groups),
            backgroundColor: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'],
            hoverBackgroundColor: ['#818cf8', '#34d399', '#fb7185', '#fbbf24', '#a78bfa'],
            borderColor: '#1e293b'
          }]
        };
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  finalizeMonth() {
    const m = this.monthControl.value;
    const y = this.yearControl.value;

    if (!m || !y) {
      this.notify.error('Por favor selecciona un mes y año.');
      return;
    }

    const monthLabel = this.months.find(x => x.value === Number(m))?.label || 'este mes';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `¿Finalizar el mes de ${monthLabel} ${y}?`,
        message: 'Se copiarán los gastos e ingresos FIJOS al mes siguiente. Los gastos variables quedarán en este mes.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.finalizeMonth(Number(m), Number(y)).subscribe({
          next: (success) => {
            if (!success) {
              this.notify.error('Hubo un problema al cerrar el mes. Revisa los logs del servidor.');
              return;
            }

            let nextM = Number(m) + 1;
            let nextY = Number(y);
            if (nextM > 12) {
              nextM = 1;
              nextY++;
            }

            localStorage.setItem(STORAGE_MONTH_KEY, String(nextM));
            localStorage.setItem(STORAGE_YEAR_KEY, String(nextY));
            this.monthControl.setValue(nextM);
            this.yearControl.setValue(nextY);

            this.notify.success(`✅ Mes de ${monthLabel} finalizado correctamente.`);
          },
          error: (err) => {
            console.error('Error al finalizar mes:', err);
            this.notify.error('Error al cerrar el mes.');
          }
        });
      }
    });
  }

  openSharedPayment(gasto: Gasto) {
    this.dialog.open(SharedPaymentDialogComponent, {
      width: '520px',
      data: gasto
    });
  }

  getPorcentajeCompartido(gasto: Gasto): number {
    if (!gasto.pagosCompartidos?.length) return 0;
    const totalPagado = gasto.pagosCompartidos.reduce((acc, p) => acc + p.monto, 0);
    return Math.min(100, (totalPagado / gasto.amount) * 100);
  }

  payGasto(gasto: Gasto) {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '400px',
      data: gasto
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.markAsPaid(result).subscribe({
          next: () => {
            this.notify.success('Gasto marcado como pagado');
          },
          error: (err) => {
            console.error('Error al pagar:', err);
            this.notify.error('Error al procesar el pago');
          }
        });
      }
    });
  }
}
