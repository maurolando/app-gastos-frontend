import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Categoria, ExpenseService } from 'src/app/services/expense/expense.service';
import { Persona, PersonaService } from 'src/app/services/persona/persona.service';
import { NotificationService } from 'src/app/services/notification/notification.service';

@Component({
  selector: 'app-expense-form',
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnInit {
  form: FormGroup;
  personas$!: Observable<Persona[]>;
  categorias$!: Observable<Categoria[]>;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private service: ExpenseService,
    private personaService: PersonaService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ExpenseFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data;

    let expenseDate = new Date();
    if (data?.date) {
      const parts = data.date.split('-');
      if (parts.length === 3) {
        expenseDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }

    let vencimientoDate = null;
    if (data?.fechaVencimiento) {
      const parts = data.fechaVencimiento.split('-');
      if (parts.length === 3) {
        vencimientoDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }

    this.form = this.fb.group({
      amount: [data?.amount || '', [Validators.required, Validators.min(0.01)]],
      categoriaId: [data?.categoria?.id || '', Validators.required],
      date: [expenseDate, Validators.required],
      description: [data?.description || ''],
      personaId: [data?.persona?.id || '', Validators.required],
      formaPago: [data?.formaPago || 'Efectivo', Validators.required],
      recurrent: [data?.recurrent || false],
      fechaVencimiento: [vencimientoDate],
      esCompartido: [data?.esCompartido || false],
      tieneCuotas: [!!data?.cuotasTotales],
      cuotaActual: [data?.cuotaActual || null, [Validators.min(1)]],
      cuotasTotales: [data?.cuotasTotales || null, [Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
    this.categorias$ = this.service.getCategorias('GASTO');

    // Inicializar validaciones si ya tiene cuotas en modo edición
    if (this.isEdit && this.form.get('tieneCuotas')?.value) {
      this.form.get('cuotaActual')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('cuotasTotales')?.setValidators([Validators.required, Validators.min(1)]);
      this.form.get('cuotaActual')?.updateValueAndValidity();
      this.form.get('cuotasTotales')?.updateValueAndValidity();
    }

    // Manejar cambios dinámicos para los campos de cuotas
    this.form.get('recurrent')?.valueChanges.subscribe(isRecurrent => {
      if (!isRecurrent) {
        this.form.get('tieneCuotas')?.setValue(false);
        this.form.get('fechaVencimiento')?.setValue(null);
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

  save() {
    if (this.form.valid) {
      const val = this.form.value;
      
      if (val.recurrent && val.tieneCuotas) {
        if (val.cuotaActual > val.cuotasTotales) {
          this.notify.error('La cuota actual no puede ser mayor que el total de cuotas');
          return;
        }
      }

      const formatDate = (d: Date | null) => {
        if (!d) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formattedDate = formatDate(val.date);
      const formattedVencimiento = formatDate(val.fechaVencimiento);
      
      const gastoData = {
        amount: val.amount,
        categoriaId: val.categoriaId,
        date: formattedDate,
        description: val.description,
        personaId: val.personaId,
        formaPago: val.formaPago,
        recurrent: val.recurrent,
        fechaVencimiento: formattedVencimiento,
        esCompartido: val.esCompartido || false,
        cuotaActual: val.recurrent && val.tieneCuotas ? val.cuotaActual : null,
        cuotasTotales: val.recurrent && val.tieneCuotas ? val.cuotasTotales : null
      };

      if (this.isEdit) {
        this.service.updateGasto(this.data.id, gastoData).subscribe({
          next: () => {
            this.notify.success('Gasto actualizado con éxito');
            this.dialogRef.close(true);
          },
          error: () => this.notify.error('Error al actualizar el gasto')
        });
      } else {
        this.service.createGasto(gastoData).subscribe({
          next: () => {
            this.notify.success('Gasto registrado con éxito');
            this.dialogRef.close(true);
          },
          error: () => this.notify.error('Error al registrar el gasto')
        });
      }
    }
  }
}
