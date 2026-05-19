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
      esCompartido: [false]
    });
  }

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
    this.categorias$ = this.service.getCategorias('GASTO');
  }

  save() {
    if (this.form.valid) {
      const val = this.form.value;
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
        esCompartido: val.esCompartido || false
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
