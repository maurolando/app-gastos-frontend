import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { PresupuestoSugerido, ReglaPresupuestoService } from 'src/app/services/regla/regla-presupuesto.service';
import { PlantillaRegla, mensajeDeError, nombrePlantilla } from 'src/app/utils/distribucion.util';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export interface SugeridosDialogData {
  mes: number;
  anio: number;
  plantilla: PlantillaRegla;
  ingreso: number;
  /** Lo que recomienda la regla para cada partida, para mostrar el margen que queda. */
  partidas: { nombre: string; montoRecomendado: number }[];
}

interface Fila {
  sugerido: PresupuestoSugerido;
  incluir: boolean;
  monto: number;
}

interface GrupoFilas {
  partida: string;
  recomendado: number;
  filas: Fila[];
}

/**
 * Vista previa de los presupuestos que propone la regla. Nada se guarda hasta
 * que el usuario revisa, ajusta y confirma; si va a pisar presupuestos que ya
 * tenía, se le vuelve a preguntar.
 */
@Component({
  selector: 'app-presupuestos-sugeridos-dialog',
  templateUrl: './presupuestos-sugeridos-dialog.component.html',
  styleUrls: ['./presupuestos-sugeridos-dialog.component.scss']
})
export class PresupuestosSugeridosDialogComponent implements OnInit {
  grupos: GrupoFilas[] = [];
  cargando = true;
  aplicando = false;
  error = '';
  nombrePlantilla = nombrePlantilla;

  constructor(
    public dialogRef: MatDialogRef<PresupuestosSugeridosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SugeridosDialogData,
    private reglaService: ReglaPresupuestoService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.reglaService.getPresupuestosSugeridos(this.data.mes, this.data.anio).subscribe({
      next: sugeridos => {
        sugeridos.forEach(s => {
          let grupo = this.grupos.find(g => g.partida === s.partida);
          if (!grupo) {
            const recomendado = this.data.partidas.find(p => p.nombre === s.partida)?.montoRecomendado ?? 0;
            grupo = { partida: s.partida, recomendado, filas: [] };
            this.grupos.push(grupo);
          }
          grupo.filas.push({ sugerido: s, incluir: true, monto: s.montoSugerido });
        });
        this.cargando = false;
      },
      error: err => {
        this.error = mensajeDeError(err, 'No se pudieron calcular los presupuestos sugeridos.');
        this.cargando = false;
      }
    });
  }

  get seleccionadas(): Fila[] {
    return this.grupos.flatMap(g => g.filas).filter(f => f.incluir);
  }

  get montosValidos(): boolean {
    return this.seleccionadas.every(f => f.monto != null && f.monto >= 0);
  }

  totalPartida(grupo: GrupoFilas): number {
    return grupo.filas.filter(f => f.incluir).reduce((acc, f) => acc + (Number(f.monto) || 0), 0);
  }

  /**
   * Cada sugerencia se redondea hacia abajo a miles, así que siempre sobran hasta
   * 1.000 Gs. por categoría. Eso es ruido del redondeo, no margen.
   */
  margen(grupo: GrupoFilas): number {
    const margen = grupo.recomendado - this.totalPartida(grupo);
    return margen > 1000 * grupo.filas.length ? margen : 0;
  }

  /** La sugerencia quedó por debajo de lo gastado porque la partida no alcanzaba. */
  fueRecortado(f: Fila): boolean {
    return f.sugerido.montoReferencia - f.sugerido.montoSugerido >= 1000;
  }

  aplicar(): void {
    const reemplazos = this.seleccionadas
      .filter(f => f.sugerido.montoActual != null && f.sugerido.montoActual !== f.monto)
      .length;

    if (reemplazos === 0) {
      this.ejecutar();
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: '¿Reemplazar presupuestos?',
        message: reemplazos === 1
          ? 'Una de las categorías ya tiene un presupuesto este mes con otro monto. Se va a reemplazar.'
          : `${reemplazos} categorías ya tienen un presupuesto este mes con otro monto. Se van a reemplazar.`
      }
    }).afterClosed().subscribe(confirmado => {
      if (confirmado) {
        this.ejecutar();
      }
    });
  }

  private ejecutar(): void {
    const presupuestos = this.seleccionadas.map(f => ({
      categoriaId: f.sugerido.categoria.id,
      monto: Number(f.monto)
    }));

    this.aplicando = true;
    this.reglaService.aplicarPresupuestos(this.data.mes, this.data.anio, presupuestos).subscribe({
      next: aplicados => {
        this.notify.success(aplicados.length === 1
          ? 'Se aplicó 1 presupuesto'
          : `Se aplicaron ${aplicados.length} presupuestos`);
        this.dialogRef.close(true);
      },
      error: err => {
        this.aplicando = false;
        this.notify.error(mensajeDeError(err, 'No se pudieron aplicar los presupuestos'));
      }
    });
  }
}
