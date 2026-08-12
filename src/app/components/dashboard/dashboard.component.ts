import { Component, OnInit, OnDestroy } from '@angular/core';
import { CierreResult, ExpenseService, Gasto } from 'src/app/services/expense/expense.service';
import { IngresoService } from 'src/app/services/ingreso/ingreso.service';
import { AhorroService } from 'src/app/services/ahorro/ahorro.service';
import { Observable, combineLatest, map, startWith, switchMap, Subject, takeUntil, shareReplay } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { SharedPaymentDialogComponent } from '../shared-payment-dialog/shared-payment-dialog.component';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { BudgetDialogComponent } from '../budget-dialog/budget-dialog.component';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';

export interface DueAlert {
  type: 'OVERDUE' | 'DUE_SOON';
  gasto: Gasto;
  days: number;
}

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
  totalPending$!: Observable<number>;
  totalIncome$!: Observable<number>;
  totalSavings$!: Observable<number>;
  balance$!: Observable<number>;
  count$!: Observable<number>;
  pendingExpenses$!: Observable<Gasto[]>;
  lastDates$!: Observable<any>;
  alerts$!: Observable<DueAlert[]>;
  budgetProgress$!: Observable<{ catId: string, catName: string, catIcon: string, amountSpent: number, budgetAmount: number, percentage: number, color: string }[]>;



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
    private ahorroService: AhorroService,
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
          this.expenseService.getGlobalBalance(m, y),
          this.ahorroService.getAhorros(m, y),
          this.expenseService.getPresupuestos(m, y)
        ]);
      }),
      takeUntil(this.destroy$),
      // Sin esto cada observable derivado (totalExpenses$, balance$, pieChartData$...)
      // abre su propia cadena de 5 watchQuery: ~40 requests por carga, y otros tantos
      // cada vez que una mutación dispara refetchQueries por nombre de operación.
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.totalExpenses$ = data$.pipe(
      map(([gastos]) => gastos
        .filter(g => g.pagado) // Solo sumamos lo pagado al total visual
        .reduce((acc, g) => acc + g.amount, 0))
    );
    // Lo que falta pagar se muestra al lado del total en vez de quedar invisible:
    // antes la diferencia entre la tarjeta y el gráfico no se explicaba en ningún lado.
    this.totalPending$ = data$.pipe(
      map(([gastos]) => gastos
        .filter(g => !g.pagado)
        .reduce((acc, g) => acc + g.amount, 0))
    );
    this.totalIncome$ = data$.pipe(
      map(([_, ingresos, __, ahorros]) => {
        const gross = ingresos.reduce((acc, i) => acc + i.monto, 0);
        const ahorro = ahorros.reduce((acc, a) => acc + a.monto, 0);
        return Math.max(0, gross - ahorro);
      })
    );
    this.totalSavings$ = data$.pipe(
      map(([_, __, ___, ahorros]) => ahorros.reduce((acc, a) => acc + a.monto, 0))
    );
    this.balance$ = data$.pipe(map(([_, __, balance]) => balance));
    this.count$ = data$.pipe(map(([gastos]) => gastos.length));
    
    this.lastDates$ = this.expenseService.getLastDates();
    
    // Gastos pendientes: recurrentes no pagados + compartidos no completamente pagados
    this.pendingExpenses$ = data$.pipe(
      map(([gastos]) => gastos.filter(g => !g.pagado))
    );

    this.alerts$ = this.pendingExpenses$.pipe(
      map(gastos => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alerts: DueAlert[] = [];

        gastos.forEach(g => {
          if (g.fechaVencimiento && !g.pagado) {
            // fechaVencimiento is 'YYYY-MM-DD'
            const parts = g.fechaVencimiento.split('-');
            const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            due.setHours(0, 0, 0, 0);

            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              alerts.push({ type: 'OVERDUE', gasto: g, days: Math.abs(diffDays) });
            } else if (diffDays <= 3) {
              alerts.push({ type: 'DUE_SOON', gasto: g, days: diffDays });
            }
          }
        });

        // Sort alerts: OVERDUE first (most overdue first), then DUE_SOON (closest to today first)
        alerts.sort((a, b) => {
          if (a.type === 'OVERDUE' && b.type !== 'OVERDUE') return -1;
          if (b.type === 'OVERDUE' && a.type !== 'OVERDUE') return 1;
          if (a.type === 'OVERDUE' && b.type === 'OVERDUE') return b.days - a.days;
          return a.days - b.days;
        });

        return alerts;
      })
    );

    this.budgetProgress$ = data$.pipe(
      map(([gastos, _, __, ___, presupuestos]) => {
        if (!presupuestos || presupuestos.length === 0) return [];

        const categorySpent: { [id: string]: number } = {};
        gastos.filter(g => g.pagado).forEach(g => {
          if (g.categoria) {
            categorySpent[g.categoria.id] = (categorySpent[g.categoria.id] || 0) + g.amount;
          }
        });

        return presupuestos.filter(p => p.monto > 0).map(p => {
          const spent = categorySpent[p.categoria.id] || 0;
          let pct = (spent / p.monto) * 100;
          let color = 'primary'; // < 80% (greenish/primary)
          if (pct >= 80 && pct < 100) color = 'accent'; // near limit
          if (pct >= 100) color = 'warn'; // exceeded

          return {
            catId: p.categoria.id,
            catName: p.categoria.nombre,
            catIcon: p.categoria.icono || 'category',
            amountSpent: spent,
            budgetAmount: p.monto,
            percentage: Math.min(pct, 100),
            color: color
          };
        });
      })
    );



    this.pieChartData$ = data$.pipe(
      map(([gastos]) => {
        const groups: { [key: string]: number } = {};
        // Mismo criterio que la tarjeta "Gasto Total" y que los presupuestos: sin
        // este filtro el gráfico sumaba más que el número de al lado.
        gastos.filter(g => g.pagado).forEach(g => {
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
          next: (resultado) => {
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

            this.notify.success(this.resumirCierre(resultado, monthLabel));
          },
          error: (err) => {
            console.error('Error al finalizar mes:', err);
            this.notify.error('Error al cerrar el mes.');
          }
        });
      }
    });
  }

  /**
   * El cierre ahora es idempotente y omite lo que ya existe en el mes destino.
   * Si se aprieta dos veces hay que decir que no se copió nada, y no repetir el
   * mismo "listo" de la primera vez.
   */
  private resumirCierre(r: CierreResult, monthLabel: string): string {
    const copiados = r.gastosCopiados + r.ingresosCopiados;
    const omitidos = r.gastosOmitidos + r.ingresosOmitidos;

    if (copiados === 0) {
      return omitidos > 0
        ? `${monthLabel} ya estaba cerrado: los ${omitidos} registros fijos ya existen en el mes siguiente.`
        : `Mes de ${monthLabel} finalizado. No había gastos ni ingresos fijos para copiar.`;
    }

    const partes: string[] = [];
    if (r.gastosCopiados > 0) {
      partes.push(`${r.gastosCopiados} gasto${r.gastosCopiados > 1 ? 's' : ''}`);
    }
    if (r.ingresosCopiados > 0) {
      partes.push(`${r.ingresosCopiados} ingreso${r.ingresosCopiados > 1 ? 's' : ''}`);
    }

    const base = `✅ ${monthLabel} finalizado. Se copiaron ${partes.join(' y ')} al mes siguiente`;
    return omitidos > 0 ? `${base} (${omitidos} ya existían).` : `${base}.`;
  }

  openAddExpense() {
    this.dialog.open(ExpenseFormComponent, { width: '450px' });
  }

  descargarReporte() {
    const m = this.monthControl.value;
    const y = this.yearControl.value;

    if (!m || !y) {
      this.notify.error('Por favor selecciona un mes y año.');
      return;
    }

    const monthLabel = this.months.find(x => x.value === Number(m))?.label || 'mes';

    this.expenseService.generarReporteMensual(Number(m), Number(y)).subscribe({
      next: (base64) => {
        try {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });

          // Descargar archivo
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Resumen_Mensual_${monthLabel}_${y}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.notify.success('Reporte descargado correctamente.');
        } catch (e) {
          console.error('Error al procesar el archivo PDF:', e);
          this.notify.error('Error al procesar el archivo PDF.');
        }
      },
      error: (err) => {
        console.error('Error al generar el reporte:', err);
        this.notify.error('Error al conectar con el servidor para generar el reporte.');
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

  openBudgetDialog() {
    const dialogRef = this.dialog.open(BudgetDialogComponent, {
      width: '500px',
      data: {
        mes: this.monthControl.value,
        anio: this.yearControl.value
      }
    });

    dialogRef.afterClosed().subscribe(changed => {
      if (changed) {
        // We trigger a reload by momentarily changing and restoring a filter
        // Actually, refetchQueries in the mutate of budget handles this usually, 
        // but here we can just update the subject or rely on apollo watchQuery
      }
    });
  }
}
