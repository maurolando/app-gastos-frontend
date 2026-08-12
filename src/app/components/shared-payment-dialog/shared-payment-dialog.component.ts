import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Persona, PersonaService } from 'src/app/services/persona/persona.service';
import { ExpenseService, Gasto } from 'src/app/services/expense/expense.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { toLocalISODate } from 'src/app/utils/date.util';

@Component({
  selector: 'app-shared-payment-dialog',
  templateUrl: './shared-payment-dialog.component.html',
  styleUrls: ['./shared-payment-dialog.component.scss']
})
export class SharedPaymentDialogComponent implements OnInit {
  form: FormGroup;
  personas$!: Observable<Persona[]>;

  get totalPagado(): number {
    return (this.data.pagosCompartidos || []).reduce((acc, p) => acc + p.monto, 0);
  }

  get porcentajePagado(): number {
    return Math.min(100, (this.totalPagado / this.data.amount) * 100);
  }

  get faltante(): number {
    return Math.max(0, this.data.amount - this.totalPagado);
  }

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private expenseService: ExpenseService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<SharedPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Gasto
  ) {
    this.form = this.fb.group({
      personaId: ['', Validators.required],
      monto: [this.faltante, [Validators.required, Validators.min(0.01)]],
      formaPago: ['Efectivo', Validators.required],
      fecha: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.personas$ = this.personaService.getPersonas();
  }

  registrarAporte() {
    if (this.form.valid) {
      const v = this.form.value;
      const fecha = toLocalISODate(v.fecha);
      this.expenseService.agregarPagoCompartido(
        this.data.id!,
        v.personaId,
        v.monto,
        v.formaPago,
        fecha
      ).subscribe({
        next: () => {
          const nuevoTotal = this.totalPagado + v.monto;
          if (nuevoTotal >= this.data.amount) {
            this.notify.success('¡Gasto completamente pagado! 🎉');
          } else {
            this.notify.success(`Aporte registrado. Falta: Gs ${(this.data.amount - nuevoTotal).toLocaleString()}`);
          }
          this.dialogRef.close(true);
        },
        error: () => this.notify.error('Error al registrar el aporte')
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
