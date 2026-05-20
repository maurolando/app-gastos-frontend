import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { ExpenseService } from 'src/app/services/expense/expense.service';
import { IngresoService } from 'src/app/services/ingreso/ingreso.service';
import { AhorroService, Ahorro } from 'src/app/services/ahorro/ahorro.service';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
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
  ahorrosList$!: Observable<Ahorro[]>;
  personas$!: Observable<Persona[]>;

  savingForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private ingresoService: IngresoService,
    private ahorroService: AhorroService,
    private personaService: PersonaService,
    private notify: NotificationService
  ) {
    this.savingForm = this.fb.group({
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fecha: [new Date(), Validators.required],
      personaId: [''],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.personas$ = this.personaService.getPersonas();

    const data$ = combineLatest([
      this.monthControl.valueChanges.pipe(startWith(this.monthControl.value)),
      this.yearControl.valueChanges.pipe(startWith(this.yearControl.value))
    ]).pipe(
      switchMap(([m, y]) => {
        return combineLatest([
          this.expenseService.getGastos(m!, y!),
          this.ingresoService.getIngresos(m!, y!),
          this.ahorroService.getAhorros(m!, y!)
        ]);
      }),
      takeUntil(this.destroy$)
    );

    this.ahorrosList$ = data$.pipe(
      map(([_, __, ahorros]) => ahorros)
    );

    this.totalGastosPagados$ = data$.pipe(
      map(([gastos, _, __]) => gastos.filter(g => g.pagado).reduce((acc, g) => acc + g.amount, 0))
    );

    this.ahorroActual$ = data$.pipe(
      map(([_, __, ahorros]) => ahorros.reduce((acc, a) => acc + a.monto, 0))
    );

    this.totalIngresos$ = data$.pipe(
      map(([_, ingresos, ahorros]) => {
        const gross = ingresos.reduce((acc, i) => acc + i.monto, 0);
        const ahorro = ahorros.reduce((acc, a) => acc + a.monto, 0);
        return Math.max(0, gross - ahorro);
      })
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

  cargarAhorro() {
    if (this.savingForm.valid) {
      const v = this.savingForm.value;
      const formattedDate = v.fecha instanceof Date ? v.fecha.toISOString().split('T')[0] : new Date(v.fecha).toISOString().split('T')[0];
      
      this.ahorroService.createAhorro(v.monto, formattedDate, v.personaId || null, v.descripcion || '')
        .subscribe({
          next: () => {
            this.notify.success('Ahorro cargado con éxito');
            this.savingForm.patchValue({
              monto: '',
              descripcion: '',
              fecha: new Date(),
              personaId: ''
            });
            this.savingForm.markAsPristine();
            this.savingForm.markAsUntouched();
          },
          error: (err) => {
            console.error('Error al cargar ahorro:', err);
            this.notify.error('Error al registrar el ahorro');
          }
        });
    } else {
      this.notify.error('Por favor completa todos los campos requeridos.');
    }
  }

  eliminarAhorro(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro de ahorro?')) {
      this.ahorroService.deleteAhorro(id).subscribe({
        next: () => {
          this.notify.success('Registro de ahorro eliminado con éxito');
        },
        error: (err) => {
          console.error('Error al eliminar ahorro:', err);
          this.notify.error('Error al eliminar el ahorro');
        }
      });
    }
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
      this.goalControl.setValue(Number(localStorage.getItem(SAVINGS_GOAL_KEY)) || 500000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
