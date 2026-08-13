import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, combineLatest, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ExpenseService, Gasto, Categoria } from 'src/app/services/expense/expense.service';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
import { ExpenseFormComponent } from '../expense-form/expense-form.component';
import { SharedPaymentDialogComponent } from '../shared-payment-dialog/shared-payment-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { LayoutService } from 'src/app/services/layout/layout.service';

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss']
})
export class ExpenseListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = ['date', 'persona', 'category', 'description', 'amount', 'acciones', 'gestion'];
  
  dataSource = new MatTableDataSource<Gasto>([]);
  personas$!: Observable<Persona[]>;
  categorias$!: Observable<Categoria[]>;

  // Filters Controls
  personaFilter = new FormControl('');
  categoriaFilter = new FormControl('');
  fechaInicioFilter = new FormControl<Date | null>(null);
  fechaFinFilter = new FormControl<Date | null>(null);
  
  hasActiveFilters$!: Observable<boolean>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private service: ExpenseService, 
    private personaService: PersonaService,
    private dialog: MatDialog,
    private notify: NotificationService,
    private layout: LayoutService
  ) {}

  esMovil$ = this.layout.esMovil$;

  /**
   * Filas ya filtradas y paginadas. En móvil la tabla de 7 columnas no entra,
   * así que las mismas filas se pintan como tarjetas desde acá.
   */
  filas$ = this.dataSource.connect();

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
    this.categorias$ = this.service.getCategorias('GASTO');

    const filterChanges$ = combineLatest([
      this.personaFilter.valueChanges.pipe(startWith('')),
      this.categoriaFilter.valueChanges.pipe(startWith('')),
      this.fechaInicioFilter.valueChanges.pipe(startWith(null)),
      this.fechaFinFilter.valueChanges.pipe(startWith(null))
    ]).pipe(takeUntil(this.destroy$));

    this.hasActiveFilters$ = filterChanges$.pipe(
      map(([p, c, fi, ff]) => !!(p || c || fi || ff))
    );

    // Reset paginator to first page on filter changes
    filterChanges$.subscribe(() => {
      if (this.paginator) {
        this.paginator.firstPage();
      }
    });

    combineLatest([
      this.service.getGastos(),
      filterChanges$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([gastos, [persona, categoria, fechaInicio, fechaFin]]) => {
        return gastos.filter(g => {
          // 1. Filtrar por persona
          if (persona && g.persona?.id !== persona) {
            return false;
          }

          // 2. Filtrar por categoría
          if (categoria && g.categoria?.id !== categoria) {
            return false;
          }

          // 3. Filtrar por rango de fechas
          if (g.date) {
            const gDate = new Date(g.date);
            gDate.setHours(0, 0, 0, 0);

            if (fechaInicio) {
              const start = new Date(fechaInicio);
              start.setHours(0, 0, 0, 0);
              if (gDate < start) return false;
            }

            if (fechaFin) {
              const end = new Date(fechaFin);
              end.setHours(0, 0, 0, 0);
              if (gDate > end) return false;
            }
          }
          return true;
        });
      })
    ).subscribe(filteredGastos => {
      this.dataSource.data = filteredGastos;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  clearFilters() {
    this.personaFilter.setValue('');
    this.categoriaFilter.setValue('');
    this.fechaInicioFilter.setValue(null);
    this.fechaFinFilter.setValue(null);
  }

  openAddExpense() {
    this.dialog.open(ExpenseFormComponent, { width: '450px' });
  }

  editExpense(gasto: Gasto) {
    this.dialog.open(ExpenseFormComponent, { width: '450px', data: gasto });
  }

  deleteExpense(gasto: Gasto) {
    const detalle = [gasto.categoria?.nombre, gasto.description]
      .filter(Boolean)
      .join(' · ');

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Borrar este gasto?',
        message: `${detalle || 'Gasto'}\n${gasto.amount.toLocaleString('es-PY')} Gs.\n\n`
          + (gasto.pagado ? 'Se va a devolver al balance. ' : '')
          + 'Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado || !gasto.id) return;

      this.service.deleteGasto(gasto.id).subscribe({
        next: (ok) => ok
          ? this.notify.success('Gasto borrado')
          : this.notify.error('No se pudo borrar el gasto'),
        error: () => this.notify.error('Error al borrar el gasto')
      });
    });
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

  ngOnDestroy() {
    this.dataSource.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
