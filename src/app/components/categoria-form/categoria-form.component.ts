import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GRUPOS } from 'src/app/utils/distribucion.util';

@Component({
  selector: 'app-categoria-form',
  templateUrl: './categoria-form.component.html',
  styleUrls: ['./categoria-form.component.scss']
})
export class CategoriaFormComponent {
  form: FormGroup;
  grupos = GRUPOS;
  availableIcons = [
    'restaurant', 'shopping_cart', 'home', 'directions_car', 'bolt', 'water_drop',
    'medical_services', 'school', 'fitness_center', 'movie', 'flight', 'payments',
    'account_balance', 'work', 'phone_iphone', 'pets', 'redeem', 'build',
    'local_gas_station', 'checkroom', 'fastfood', 'coffee', 'icecream', 'lunch_dining',
    'local_bar', 'store', 'card_giftcard', 'savings', 'trending_up', 'attach_money',
    'shopping_bag', 'theater_comedy', 'sports_esports', 'directions_bus', 'hotel', 'receipt_long'
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CategoriaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      nombre: [data?.nombre || '', Validators.required],
      icono: [data?.icono || 'category', Validators.required],
      tipo: [data?.tipo || 'GASTO', Validators.required],
      grupo: [data?.grupo ?? null]
    });
  }

  get descripcionGrupo(): string {
    return this.grupos.find(g => g.valor === this.form.get('grupo')?.value)?.descripcion ?? '';
  }

  onCancel() { this.dialogRef.close(); }

  onSave() {
    if (!this.form.valid) return;
    const valor = this.form.value;
    // Solo los gastos entran en la guía de distribución.
    this.dialogRef.close({ ...valor, grupo: valor.tipo === 'GASTO' ? valor.grupo : null });
  }
}
