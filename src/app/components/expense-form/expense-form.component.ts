import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
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

  constructor(
    private fb: FormBuilder,
    private service: ExpenseService,
    private personaService: PersonaService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ExpenseFormComponent>
  ) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      categoriaId: ['', Validators.required],
      date: [new Date(), Validators.required],
      description: [''],
      personaId: ['', Validators.required],
      formaPago: ['Efectivo', Validators.required],
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

      const formattedDate = val.date.toISOString().split('T')[0];
      
      this.service.createGasto({
        amount: val.amount,
        categoriaId: val.categoriaId,
        date: formattedDate,
        description: val.description,
        personaId: val.personaId,
        formaPago: val.formaPago,
        recurrent: val.recurrent,
        fechaVencimiento: val.fechaVencimiento ? val.fechaVencimiento.toISOString().split('T')[0] : null,
        esCompartido: val.esCompartido || false,
        cuotaActual: val.recurrent && val.tieneCuotas ? val.cuotaActual : null,
        cuotasTotales: val.recurrent && val.tieneCuotas ? val.cuotasTotales : null
      }).subscribe({
        next: () => {
          this.notify.success('Gasto registrado con éxito');
          this.dialogRef.close(true);
        },
        error: () => this.notify.error('Error al registrar el gasto')
      });
    }
  }
}
