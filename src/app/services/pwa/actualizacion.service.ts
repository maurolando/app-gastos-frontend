import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../notification/notification.service';

/**
 * Avisa cuando hay una versión nueva instalada y ofrece recargar.
 *
 * El service worker sirve siempre lo que tiene cacheado, así que sin esto una
 * versión nueva no llega hasta que el usuario cierra todas las pestañas de la
 * app. Instalada en el teléfono eso puede no pasar en semanas: quedarían
 * usando una versión vieja sin saberlo, que es peor que no cachear nada.
 */
@Injectable({ providedIn: 'root' })
export class ActualizacionService {

  constructor(
    private updates: SwUpdate,
    private notify: NotificationService
  ) {}

  iniciar() {
    // En desarrollo el service worker está deshabilitado y no hay nada que oír.
    if (!this.updates.isEnabled) {
      return;
    }

    this.updates.versionUpdates.pipe(
      filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY')
    ).subscribe(() => {
      const aviso = this.notify.action('Hay una versión nueva de la app', 'Actualizar');
      aviso.onAction().subscribe(() => document.location.reload());
    });
  }
}
