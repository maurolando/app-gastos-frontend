import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Ingreso, IngresoService } from 'src/app/services/ingreso/ingreso.service';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
import { Categoria, ExpenseService } from 'src/app/services/expense/expense.service';
import { Observable } from 'rxjs';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { fromLocalISODate, toLocalISODate } from 'src/app/utils/date.util';

@Component({
  selector: 'app-ingreso-form',
  templateUrl: './ingreso-form.component.html',
  styleUrls: ['./ingreso-form.component.scss']
})
export class IngresoFormComponent implements OnInit {
  form: FormGroup;
  personas$!: Observable<Persona[]>;
  categorias$!: Observable<Categoria[]>;

  /** Sin ingreso es alta; con ingreso, edicion. El dialogo lo decide al abrirse. */
  get editando(): boolean {
    return !!this.ingreso?.id;
  }

  constructor(
    private fb: FormBuilder,
    private service: IngresoService,
    private personaService: PersonaService,
    private expenseService: ExpenseService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<IngresoFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public ingreso: Ingreso | null
  ) {
    this.form = this.fb.group({
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fecha: [new Date(), Validators.required],
      categoriaId: ['', Validators.required],
      personaId: ['', Validators.required],
      recurrent: [false]
    });
  }

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
    this.categorias$ = this.expenseService.getCategorias('INGRESO');

    if (this.ingreso) {
      this.form.patchValue({
        monto: this.ingreso.monto,
        // La fecha llega como 'YYYY-MM-DD'; el datepicker necesita un Date local.
        fecha: fromLocalISODate(this.ingreso.fecha),
        categoriaId: this.ingreso.categoria?.id,
        personaId: this.ingreso.persona?.id,
        recurrent: !!this.ingreso.recurrent
      });
    }
  }

  save() {
    if (!this.form.valid) return;

    const v = this.form.value;
    const fecha = toLocalISODate(v.fecha);

    const peticion = this.editando
      ? this.service.updateIngreso(this.ingreso!.id!, v.monto, fecha, v.categoriaId, v.personaId, v.recurrent)
      : this.service.createIngreso(v.monto, fecha, v.categoriaId, v.personaId, v.recurrent);

    peticion.subscribe({
      next: () => {
        this.notify.success(this.editando ? 'Ingreso actualizado' : 'Ingreso registrado con éxito');
        this.dialogRef.close(true);
      },
      error: () => this.notify.error(
        this.editando ? 'No se pudo actualizar el ingreso' : 'Error al registrar el ingreso')
    });
  }
}
