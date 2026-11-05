import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, switchMap } from 'rxjs';
import { AjusteBalance, ExpenseService } from 'src/app/services/expense/expense.service';
import { HogarService } from 'src/app/services/hogar/hogar.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { periodoDe, toLocalISODate } from 'src/app/utils/date.util';

export interface AjusteDialogData { mes: number; anio: number; }

/**
 * Suma o resta al balance del mes que se está mirando (#50). El ajuste no es
 * ingreso ni gasto: no aparece en reportes ni en la guía.
 */
@Component({
  selector: 'app-ajuste-balance-dialog',
  templateUrl: './ajuste-balance-dialog.component.html',
  styleUrls: ['./ajuste-balance-dialog.component.scss']
})
export class AjusteBalanceDialogComponent {
  form = this.fb.group({
    monto: [null as number | null, [Validators.required, Validators.min(1)]],
    descripcion: ['']
  });
  ajustes$: Observable<AjusteBalance[]> = this.expenseService.getAjustesBalance(this.data.mes, this.data.anio);
  guardando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AjusteDialogData,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private hogarService: HogarService,
    private notify: NotificationService
  ) {}

  guardar(signo: 1 | -1): void {
    if (this.form.invalid) return;
    const { monto, descripcion } = this.form.value;
    this.guardando = true;
    this.hogarService.getConfig().pipe(
      switchMap(config => this.expenseService.createAjusteBalance(
        signo * monto!, toLocalISODate(this.fechaDelMes(config.diaInicioMes))!, descripcion || null))
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.form.reset();
        this.notify.success(signo > 0 ? 'Se sumó al balance' : 'Se restó del balance');
      },
      error: () => {
        this.guardando = false;
        this.notify.error('No se pudo guardar el ajuste');
      }
    });
  }

  borrar(a: AjusteBalance): void {
    this.expenseService.deleteAjusteBalance(a.id).subscribe({
      next: () => this.notify.success('Ajuste borrado'),
      error: () => this.notify.error('No se pudo borrar el ajuste')
    });
  }

  /** Hoy si cae en el mes que se mira; si no, el primer día de ese mes del hogar. */
  private fechaDelMes(diaInicio: number): Date {
    const hoy = new Date();
    const actual = periodoDe(hoy, diaInicio);
    return actual.mes === this.data.mes && actual.anio === this.data.anio
      ? hoy
      : new Date(this.data.anio, this.data.mes - 1, diaInicio);
  }
}
