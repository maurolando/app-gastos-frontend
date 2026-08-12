import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Persona, PersonaService } from 'src/app/services/persona/persona.service';
import { Gasto } from 'src/app/services/expense/expense.service';
import { toLocalISODate } from 'src/app/utils/date.util';

@Component({
  selector: 'app-payment-dialog',
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.scss']
})
export class PaymentDialogComponent implements OnInit {
  form: FormGroup;
  personas$!: Observable<Persona[]>;

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Gasto
  ) {
    this.form = this.fb.group({
      amount: [data.amount, [Validators.required, Validators.min(0.01)]],
      personaId: [data.persona?.id || '', Validators.required],
      formaPago: [data.formaPago || 'Efectivo', Validators.required],
      fechaPago: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
  }

  onCancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.form.valid) {
      const val = this.form.value;
      this.dialogRef.close({
        id: this.data.id,
        amount: val.amount,
        personaId: val.personaId,
        formaPago: val.formaPago,
        fechaPago: toLocalISODate(val.fechaPago)
      });
    }
  }
}
