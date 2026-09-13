import { formatNumber } from '@angular/common';
import { Component, Inject, Input, LOCALE_ID, OnChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, ReplaySubject, distinctUntilChanged, shareReplay, switchMap } from 'rxjs';
import {
  DistribucionRegla, PartidaDistribucion, ReglaPresupuestoService
} from 'src/app/services/regla/regla-presupuesto.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { mensajeDeError, nombrePlantilla } from 'src/app/utils/distribucion.util';
import { ReglaDialogData, ReglaPresupuestoDialogComponent } from '../regla-presupuesto-dialog/regla-presupuesto-dialog.component';
import {
  PresupuestosSugeridosDialogComponent, SugeridosDialogData
} from '../presupuestos-sugeridos-dialog/presupuestos-sugeridos-dialog.component';

/**
 * Guía de distribución del ingreso en el dashboard. Es opcional: sin una regla
 * activa solo muestra la que conviene según el ingreso del mes, y nunca bloquea
 * ni modifica nada sin que el usuario lo pida.
 */
@Component({
  selector: 'app-regla-presupuesto-card',
  templateUrl: './regla-presupuesto-card.component.html',
  styleUrls: ['./regla-presupuesto-card.component.scss']
})
export class ReglaPresupuestoCardComponent implements OnChanges {
  @Input() mes: number | null = null;
  @Input() anio: number | null = null;

  distribucion$: Observable<DistribucionRegla>;
  nombrePlantilla = nombrePlantilla;

  private filtro$ = new ReplaySubject<{ mes: number; anio: number }>(1);

  constructor(
    private reglaService: ReglaPresupuestoService,
    private dialog: MatDialog,
    private notify: NotificationService,
    @Inject(LOCALE_ID) private locale: string
  ) {
    this.distribucion$ = this.filtro$.pipe(
      distinctUntilChanged((a, b) => a.mes === b.mes && a.anio === b.anio),
      switchMap(f => this.reglaService.getDistribucion(f.mes, f.anio)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  ngOnChanges(): void {
    if (this.mes && this.anio) {
      this.filtro$.next({ mes: Number(this.mes), anio: Number(this.anio) });
    }
  }

  /** En una regla personalizada, los grupos en 0% y sin movimientos solo agregan ruido. */
  partidasVisibles(d: DistribucionRegla): PartidaDistribucion[] {
    return d.partidas.filter(p => p.porcentaje > 0 || p.montoReal > 0);
  }

  avance(p: PartidaDistribucion): number {
    if (p.montoRecomendado <= 0) {
      return p.montoReal > 0 ? 100 : 0;
    }
    return Math.min(100, (p.montoReal / p.montoRecomendado) * 100);
  }

  /** Mismos umbrales que las barras de presupuesto del dashboard: 80% avisa, 100% excede. */
  color(p: PartidaDistribucion): 'primary' | 'accent' | 'warn' {
    if (p.esAhorro) {
      return 'primary';
    }
    if (p.montoReal > p.montoRecomendado) {
      return 'warn';
    }
    return this.avance(p) >= 80 ? 'accent' : 'primary';
  }

  /** El ahorro es una meta (pasarse es bueno); el resto es un techo. */
  textoEstado(p: PartidaDistribucion): string {
    const diferencia = p.montoRecomendado - p.montoReal;
    if (p.esAhorro) {
      return diferencia > 0 ? `Faltan ${this.gs(diferencia)} para la meta` : 'Meta cumplida';
    }
    return diferencia >= 0 ? `Disponible ${this.gs(diferencia)}` : `Excedido por ${this.gs(-diferencia)}`;
  }

  claseEstado(p: PartidaDistribucion): string {
    if (p.esAhorro) {
      return p.montoReal >= p.montoRecomendado ? 'ok' : '';
    }
    const color = this.color(p);
    return color === 'warn' ? 'exceso' : color === 'accent' ? 'alerta' : '';
  }

  activar(d: DistribucionRegla): void {
    this.reglaService.guardarRegla(d.plantilla).subscribe({
      next: () => this.notify.success(`Guía activada con la regla ${nombrePlantilla(d.plantilla)}`),
      error: err => this.notify.error(mensajeDeError(err, 'No se pudo activar la guía'))
    });
  }

  abrirRegla(d: DistribucionRegla, pestania = 0): void {
    const data: ReglaDialogData = {
      activa: d.activa,
      plantillaActual: d.plantilla,
      sugerida: d.plantillaSugerida,
      pestania
    };
    this.dialog.open(ReglaPresupuestoDialogComponent, { width: '680px', maxWidth: '95vw', data });
  }

  abrirSugeridos(d: DistribucionRegla): void {
    const data: SugeridosDialogData = {
      mes: Number(this.mes),
      anio: Number(this.anio),
      plantilla: d.plantilla,
      ingreso: d.ingresoMensual,
      partidas: d.partidas.map(p => ({ nombre: p.nombre, montoRecomendado: p.montoRecomendado }))
    };
    this.dialog.open(PresupuestosSugeridosDialogComponent, { width: '640px', maxWidth: '95vw', data });
  }

  private gs(monto: number): string {
    return `${formatNumber(monto, this.locale, '1.0-0')} Gs.`;
  }
}
