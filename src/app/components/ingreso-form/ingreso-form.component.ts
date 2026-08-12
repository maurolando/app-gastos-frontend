import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { IngresoService } from 'src/app/services/ingreso/ingreso.service';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
import { Categoria, ExpenseService } from 'src/app/services/expense/expense.service';
import { Observable } from 'rxjs';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { toLocalISODate } from 'src/app/utils/date.util';

@Component({
  selector: 'app-ingreso-form',
  templateUrl: './ingreso-form.component.html',
  styleUrls: ['./ingreso-form.component.scss']
})
export class IngresoFormComponent implements OnInit {
  form: FormGroup;
  personas$!: Observable<Persona[]>;
  categorias$!: Observable<Categoria[]>;

  constructor(
    private fb: FormBuilder,
    private service: IngresoService,
    private personaService: PersonaService,
    private expenseService: ExpenseService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<IngresoFormComponent>
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
  }

  save() {
    if (this.form.valid) {
      const v = this.form.value;
      const formattedDate = toLocalISODate(v.fecha);
      this.service.createIngreso(v.monto, formattedDate, v.categoriaId, v.personaId, v.recurrent)
        .subscribe({
          next: () => {
            this.notify.success('Ingreso registrado con éxito');
            this.dialogRef.close(true);
          },
          error: () => this.notify.error('Error al registrar el ingreso')
        });
    }
  }
}
