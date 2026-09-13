import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { take } from 'rxjs';
import { Categoria, ExpenseService } from 'src/app/services/expense/expense.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { ReglaPresupuestoService } from 'src/app/services/regla/regla-presupuesto.service';
import {
  GRUPOS, GrupoGasto, PLANTILLAS, PlantillaRegla, mensajeDeError, nombreGrupo, nombrePlantilla
} from 'src/app/utils/distribucion.util';

export interface ReglaDialogData {
  activa: boolean;
  plantillaActual: PlantillaRegla;
  sugerida: PlantillaRegla | null;
  /** 0 = elegir regla, 1 = clasificar categorías. */
  pestania?: number;
}

@Component({
  selector: 'app-regla-presupuesto-dialog',
  templateUrl: './regla-presupuesto-dialog.component.html',
  styleUrls: ['./regla-presupuesto-dialog.component.scss']
})
export class ReglaPresupuestoDialogComponent implements OnInit {
  plantillas = PLANTILLAS;
  grupos = GRUPOS;

  seleccionada: PlantillaRegla;
  pestania: number;
  categorias: Categoria[] = [];
  guardando = false;

  // Punto de partida de la personalizada si nunca se guardó una: la 50/30/20.
  porcentajes: Record<GrupoGasto, number> = {
    NECESIDADES: 50, DESEOS: 30, EDUCACION: 0, AHORRO: 20, INVERSION: 0, DONACIONES: 0
  };

  constructor(
    public dialogRef: MatDialogRef<ReglaPresupuestoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReglaDialogData,
    private reglaService: ReglaPresupuestoService,
    private expenseService: ExpenseService,
    private notify: NotificationService
  ) {
    this.seleccionada = data.plantillaActual;
    this.pestania = data.pestania ?? 0;
  }

  ngOnInit(): void {
    this.reglaService.getRegla().subscribe({
      next: regla => {
        if (regla && regla.porcentajes.length > 0) {
          GRUPOS.forEach(g => this.porcentajes[g.valor] = 0);
          regla.porcentajes.forEach(p => this.porcentajes[p.grupo] = p.porcentaje);
        }
      },
      error: err => console.error('Error al cargar la regla:', err)
    });

    // take(1): la lista se edita en el lugar al clasificar, y el refetch de
    // GetCategorias no debe reemplazarla mientras el diálogo está abierto.
    this.expenseService.getCategorias('GASTO').pipe(take(1)).subscribe({
      next: cats => this.categorias = [...cats].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      error: () => this.notify.error('Error al cargar las categorías')
    });
  }

  get suma(): number {
    return GRUPOS.reduce((acc, g) => acc + (Number(this.porcentajes[g.valor]) || 0), 0);
  }

  get sumaValida(): boolean {
    return Math.abs(this.suma - 100) < 0.01;
  }

  get puedeGuardar(): boolean {
    return this.seleccionada !== 'PERSONALIZADA' || this.sumaValida;
  }

  get sinClasificar(): number {
    return this.categorias.filter(c => !c.grupo).length;
  }

  guardar(): void {
    const porcentajes = GRUPOS.map(g => ({ grupo: g.valor, porcentaje: Number(this.porcentajes[g.valor]) || 0 }));
    this.guardando = true;
    this.reglaService.guardarRegla(this.seleccionada, porcentajes).subscribe({
      next: () => {
        this.notify.success(`Guía activada con la regla ${nombrePlantilla(this.seleccionada)}`);
        this.dialogRef.close(true);
      },
      error: err => {
        this.guardando = false;
        this.notify.error(mensajeDeError(err, 'No se pudo guardar la regla'));
      }
    });
  }

  desactivar(): void {
    this.reglaService.desactivarRegla().subscribe({
      next: () => {
        this.notify.success('Guía desactivada. Tus presupuestos no se modificaron.');
        this.dialogRef.close(true);
      },
      error: () => this.notify.error('No se pudo desactivar la guía')
    });
  }

  cambiarGrupo(categoria: Categoria, grupo: GrupoGasto | null): void {
    const anterior = categoria.grupo ?? null;
    categoria.grupo = grupo;
    this.expenseService.updateCategoria(categoria.id, {
      nombre: categoria.nombre,
      icono: categoria.icono,
      tipo: categoria.tipo,
      grupo
    }).subscribe({
      next: () => this.notify.success(`${categoria.nombre}: ${nombreGrupo(grupo)}`),
      error: () => {
        categoria.grupo = anterior;
        this.notify.error(`No se pudo clasificar ${categoria.nombre}`);
      }
    });
  }
}
