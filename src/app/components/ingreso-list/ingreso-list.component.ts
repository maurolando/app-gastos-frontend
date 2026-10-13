import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { IngresoService, Ingreso } from 'src/app/services/ingreso/ingreso.service';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
import { ExpenseService, Categoria } from 'src/app/services/expense/expense.service';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { IngresoFormComponent } from '../ingreso-form/ingreso-form.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { NotificationService } from 'src/app/services/notification/notification.service';

@Component({
  selector: 'app-ingreso-list',
  templateUrl: './ingreso-list.component.html',
  styleUrls: ['./ingreso-list.component.scss']
})
export class IngresoListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['fecha', 'persona', 'tipo', 'monto'];
  ingresos$!: Observable<Ingreso[]>;
  personas$!: Observable<Persona[]>;
  categorias$!: Observable<Categoria[]>;

  // Filters Controls
  personaFilter = new FormControl('');
  categoriaFilter = new FormControl('');
  fechaInicioFilter = new FormControl<Date | null>(null);
  fechaFinFilter = new FormControl<Date | null>(null);

  hasActiveFilters$!: Observable<boolean>;

  /** Mismo patron que categorias: se elige una fila y aparecen sus acciones. */
  selectedIngreso: Ingreso | null = null;

  constructor(
    private service: IngresoService, 
    private personaService: PersonaService,
    private expenseService: ExpenseService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
    this.categorias$ = this.expenseService.getCategorias('INGRESO');

    const filterChanges$ = combineLatest([
      this.personaFilter.valueChanges.pipe(startWith('')),
      this.categoriaFilter.valueChanges.pipe(startWith('')),
      this.fechaInicioFilter.valueChanges.pipe(startWith(null)),
      this.fechaFinFilter.valueChanges.pipe(startWith(null))
    ]).pipe(takeUntil(this.destroy$));

    this.hasActiveFilters$ = filterChanges$.pipe(
      map(([p, c, fi, ff]) => !!(p || c || fi || ff))
    );

    this.ingresos$ = combineLatest([
      this.service.getIngresos(),
      filterChanges$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([ingresos, [persona, categoria, fechaInicio, fechaFin]]) => {
        return ingresos.filter(i => {
          // 1. Filtrar por persona
          if (persona && i.persona?.id !== persona) {
            return false;
          }

          // 2. Filtrar por categoría
          if (categoria && i.categoria?.id !== categoria) {
            return false;
          }

          // 3. Filtrar por rango de fechas
          if (i.fecha) {
            const iDate = new Date(i.fecha);
            iDate.setHours(0, 0, 0, 0);

            if (fechaInicio) {
              const start = new Date(fechaInicio);
              start.setHours(0, 0, 0, 0);
              if (iDate < start) return false;
            }

            if (fechaFin) {
              const end = new Date(fechaFin);
              end.setHours(0, 0, 0, 0);
              if (iDate > end) return false;
            }
          }
          return true;
        });
      })
    );
  }

  clearFilters() {
    this.personaFilter.setValue('');
    this.categoriaFilter.setValue('');
    this.fechaInicioFilter.setValue(null);
    this.fechaFinFilter.setValue(null);
  }

  openAddIngreso() {
    this.dialog.open(IngresoFormComponent, {
      width: '450px'
    });
  }

  /** Volver a tocar la fila elegida la deselecciona, como en categorias. */
  selectIngreso(ingreso: Ingreso) {
    this.selectedIngreso = this.selectedIngreso?.id === ingreso.id ? null : ingreso;
  }

  editIngreso(ingreso: Ingreso, event: Event) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(IngresoFormComponent, {
      width: '450px',
      data: ingreso
    });
    dialogRef.afterClosed().subscribe(guardado => {
      if (guardado) {
        this.selectedIngreso = null;
      }
    });
  }

  deleteIngreso(ingreso: Ingreso, event: Event) {
    event.stopPropagation();
    const detalle = [ingreso.categoria?.nombre, ingreso.persona?.nombre]
      .filter(Boolean)
      .join(' · ');

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Borrar este ingreso?',
        message: `${detalle || 'Ingreso'}\n${ingreso.monto.toLocaleString('es-PY')} Gs.\n\n`
          + 'Se va a descontar del balance. Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.service.deleteIngreso(ingreso.id!).subscribe({
        next: () => {
          this.selectedIngreso = null;
          this.notify.success('Ingreso eliminado');
        },
        error: () => this.notify.error('No se pudo eliminar el ingreso')
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
