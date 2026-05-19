import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { ExpenseService } from 'src/app/services/expense/expense.service';
import { IngresoService } from 'src/app/services/ingreso/ingreso.service';
import { NotificationService } from 'src/app/services/notification/notification.service';

const SAVINGS_GOAL_KEY = 'app_gastos_savings_goal';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.scss']
})
export class AhorrosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  monthControl = new FormControl(new Date().getMonth() + 1);
  yearControl = new FormControl(new Date().getFullYear());
  
  goalControl = new FormControl(Number(localStorage.getItem(SAVINGS_GOAL_KEY)) || 500000);
  isEditingGoal = false;

  years = [2024, 2025, 2026, 2027];
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  totalIngresos$!: Observable<number>;
  totalGastosPagados$!: Observable<number>;
  ahorroActual$!: Observable<number>;
  ahorroPercent$!: Observable<number>;
  ahorroFaltante$!: Observable<number>;

  constructor(
    private expenseService: ExpenseService,
    private ingresoService: IngresoService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    const data$ = combineLatest([
      this.monthControl.valueChanges.pipe(startWith(this.monthControl.value)),
      this.yearControl.valueChanges.pipe(startWith(this.yearControl.value))
    ]).pipe(
      switchMap(([m, y]) => {
        return combineLatest([
          this.expenseService.getGastos(m!, y!),
          this.ingresoService.getIngresos(m!, y!)
        ]);
      }),
      takeUntil(this.destroy$)
    );

    this.totalIngresos$ = data$.pipe(
      map(([_, ingresos]) => ingresos.reduce((acc, i) => acc + i.monto, 0))
    );

    this.totalGastosPagados$ = data$.pipe(
      map(([gastos, _]) => gastos.filter(g => g.pagado).reduce((acc, g) => acc + g.amount, 0))
    );

    this.ahorroActual$ = combineLatest([this.totalIngresos$, this.totalGastosPagados$]).pipe(
      map(([ingresos, gastos]) => Math.max(0, ingresos - gastos))
    );

    this.ahorroPercent$ = combineLatest([this.ahorroActual$, this.goalControl.valueChanges.pipe(startWith(this.goalControl.value))]).pipe(
      map(([actual, goal]) => {
        if (!goal || goal <= 0) return 0;
        return Math.min(100, (actual / goal) * 100);
      })
    );

    this.ahorroFaltante$ = combineLatest([this.ahorroActual$, this.goalControl.valueChanges.pipe(startWith(this.goalControl.value))]).pipe(
      map(([actual, goal]) => Math.max(0, (goal || 0) - actual))
    );
  }

  saveGoal() {
    const val = this.goalControl.value;
    if (val && val > 0) {
      localStorage.setItem(SAVINGS_GOAL_KEY, String(val));
      this.isEditingGoal = false;
      this.notify.success('Meta de ahorro actualizada');
    } else {
      this.notify.error('La meta debe ser mayor a 0');
    }
  }

  toggleEditGoal() {
    this.isEditingGoal = !this.isEditingGoal;
    if (!this.isEditingGoal) {
      // Revert if cancelled
      this.goalControl.setValue(Number(localStorage.getItem(SAVINGS_GOAL_KEY)) || 500000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
