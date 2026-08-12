import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Categoria, ExpenseService, Gasto } from 'src/app/services/expense/expense.service';
import { Persona, PersonaService } from 'src/app/services/persona/persona.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { fromLocalISODate, toLocalISODate } from 'src/app/utils/date.util';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnInit {
  form: FormGroup;
  personas$!: Observable<Persona[]>;
  categorias$!: Observable<Categoria[]>;

  /** El diálogo se abre sin data para registrar y con un gasto para editarlo. */
  get esEdicion(): boolean {
    return !!this.gastoAEditar?.id;
  }

  constructor(
    private fb: FormBuilder,
    private service: ExpenseService,
    private personaService: PersonaService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ExpenseFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private gastoAEditar: Gasto | null
  ) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      categoriaId: ['', Validators.required],
      date: [new Date(), Validators.required],
      description: [''],
      personaId: ['', Validators.required],
      formaPago: ['Efectivo', Validators.required],
      // Un gasto variable normalmente ya se pagó al momento de registrarlo:
      // arranca en true para que impacte el balance sin un segundo paso.
      pagado: [true],
      recurrent: [false],
      fechaVencimiento: [null],
      esCompartido: [false],
      tieneCuotas: [false],
      cuotaActual: [null, [Validators.min(1)]],
      cuotasTotales: [null, [Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
    this.categorias$ = this.service.getCategorias('GASTO');

    // Se carga antes de suscribir a valueChanges: si no, los defaults por tipo
    // pisarían los valores del gasto que se está editando.
    if (this.esEdicion) {
      this.cargarGastoAEditar();
    }

    // Manejar cambios dinámicos para los campos de cuotas
    this.form.get('recurrent')?.valueChanges.subscribe(isRecurrent => {
      if (!isRecurrent) {
        this.form.get('tieneCuotas')?.setValue(false);
        this.form.get('fechaVencimiento')?.setValue(null);
      }
      // Un gasto fijo es un compromiso a vencer: por defecto queda pendiente.
      // El usuario puede sobreescribirlo con el toggle "Ya está pagado".
      // En gastos compartidos el toggle está deshabilitado y manda esCompartido.
      const pagadoCtrl = this.form.get('pagado');
      if (pagadoCtrl?.enabled) {
        pagadoCtrl.setValue(!isRecurrent);
      }
    });

    // Un gasto compartido se salda con los aportes de cada persona,
    // no con el toggle: lo forzamos a pendiente mientras esté marcado.
    this.form.get('esCompartido')?.valueChanges.subscribe(esCompartido => {
      const pagadoCtrl = this.form.get('pagado');
      if (esCompartido) {
        pagadoCtrl?.setValue(false);
        pagadoCtrl?.disable();
      } else {
        pagadoCtrl?.enable();
        pagadoCtrl?.setValue(!this.form.get('recurrent')?.value);
      }
    });

    this.form.get('tieneCuotas')?.valueChanges.subscribe(hasQuotas => {
      const cuotaActualCtrl = this.form.get('cuotaActual');
      const cuotasTotalesCtrl = this.form.get('cuotasTotales');
      if (hasQuotas) {
        cuotaActualCtrl?.setValidators([Validators.required, Validators.min(1)]);
        cuotasTotalesCtrl?.setValidators([Validators.required, Validators.min(1)]);
        if (cuotaActualCtrl?.value == null) {
          cuotaActualCtrl?.setValue(1);
        }
      } else {
        cuotaActualCtrl?.clearValidators();
        cuotasTotalesCtrl?.clearValidators();
        cuotaActualCtrl?.setValue(null);
        cuotasTotalesCtrl?.setValue(null);
      }
      cuotaActualCtrl?.updateValueAndValidity();
      cuotasTotalesCtrl?.updateValueAndValidity();
    });
  }

  private cargarGastoAEditar() {
    const g = this.gastoAEditar!;
    const tieneCuotas = !!g.cuotasTotales;

    this.form.patchValue({
      amount: g.amount,
      categoriaId: g.categoria?.id || '',
      date: fromLocalISODate(g.date),
      description: g.description || '',
      personaId: g.persona?.id || '',
      formaPago: g.formaPago || 'Efectivo',
      pagado: !!g.pagado,
      recurrent: !!g.recurrent,
      fechaVencimiento: fromLocalISODate(g.fechaVencimiento),
      esCompartido: !!g.esCompartido,
      tieneCuotas,
      cuotaActual: g.cuotaActual ?? null,
      cuotasTotales: g.cuotasTotales ?? null
    });

    // Los validadores de cuotas los aplica la suscripción a tieneCuotas, que
    // todavía no existe cuando se carga el gasto.
    if (tieneCuotas) {
      this.form.get('cuotaActual')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('cuotasTotales')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('cuotaActual')?.updateValueAndValidity();
      this.form.get('cuotasTotales')?.updateValueAndValidity();
    }

    if (g.esCompartido) {
      this.form.get('pagado')?.disable();
    }
  }

  save() {
    if (this.form.valid) {
      // getRawValue: 'pagado' se deshabilita en gastos compartidos y form.value lo omitiría.
      const val = this.form.getRawValue();

      if (val.recurrent && val.tieneCuotas) {
        if (val.cuotaActual > val.cuotasTotales) {
          this.notify.error('La cuota actual no puede ser mayor que el total de cuotas');
          return;
        }
      }

      const esCompartido = val.esCompartido || false;
      // En un gasto compartido manda la suma de aportes, no el toggle. Al editar
      // se conserva el estado actual: forzarlo a false reabriría uno ya saldado.
      const pagado = esCompartido
        ? (this.esEdicion ? !!this.gastoAEditar!.pagado : false)
        : !!val.pagado;

      const payload = {
        amount: val.amount,
        categoriaId: val.categoriaId,
        date: toLocalISODate(val.date),
        description: val.description,
        personaId: val.personaId,
        formaPago: val.formaPago,
        recurrent: val.recurrent,
        pagado,
        fechaVencimiento: toLocalISODate(val.fechaVencimiento),
        esCompartido,
        cuotaActual: val.recurrent && val.tieneCuotas ? val.cuotaActual : null,
        cuotasTotales: val.recurrent && val.tieneCuotas ? val.cuotasTotales : null
      };

      if (this.esEdicion) {
        this.service.updateGasto(this.gastoAEditar!.id!, payload).subscribe({
          next: () => {
            this.notify.success('Gasto actualizado');
            this.dialogRef.close(true);
          },
          error: () => this.notify.error('Error al actualizar el gasto')
        });
        return;
      }

      this.service.createGasto(payload).subscribe({
        next: () => {
          this.notify.success(pagado
            ? 'Gasto registrado y descontado del balance'
            : 'Gasto registrado como pendiente de pago');
          this.dialogRef.close(true);
        },
        error: () => this.notify.error('Error al registrar el gasto')
      });
    }
  }
}
