import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import qrcode from 'qrcode-generator';
import { PersonaService, Persona, Invitacion } from 'src/app/services/persona/persona.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { mensajeDeError } from 'src/app/utils/distribucion.util';
import { Observable } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PersonaFormComponent } from '../persona-form/persona-form.component';
import { PersonaSummaryDialogComponent } from '../persona-summary-dialog/persona-summary-dialog.component';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';
import { HogarService } from 'src/app/services/hogar/hogar.service';

@Component({
  selector: 'app-persona-list',
  templateUrl: './persona-list.component.html',
  styleUrls: ['./persona-list.component.scss']
})
export class PersonaListComponent implements OnInit {
  displayedColumns: string[] = ['nombre', 'creadoEn', 'activo', 'acciones'];
  personas$!: Observable<Persona[]>;

  @ViewChild('invitacionDialog') invitacionTpl!: TemplateRef<unknown>;
  invitacion?: { codigo: string; expiraEn: string; enlace: string; qr: string };
  generando = false;

  @ViewChild('mesDialog') mesTpl!: TemplateRef<unknown>;
  /** Del 29 en adelante febrero no tendría día de inicio. */
  dias = Array.from({ length: 28 }, (_, i) => i + 1);
  config = { diaInicioMes: 1, cierreAutomatico: false };
  guardando = false;

  constructor(private service: PersonaService, private dialog: MatDialog, private notify: NotificationService,
              private hogarService: HogarService) {}

  /** Día en que arranca el mes del hogar (p. ej. el de cobro). Es uno solo para todas las personas. */
  configurarMes() {
    this.hogarService.getConfig().subscribe({
      next: config => {
        this.config = { ...config };
        this.dialog.open(this.mesTpl, { width: '400px' });
      },
      error: err => this.notify.error(mensajeDeError(err, 'No se pudo leer la configuración.'))
    });
  }

  guardarMes() {
    this.guardando = true;
    this.hogarService.setConfig(this.config.diaInicioMes, this.config.cierreAutomatico).subscribe({
      next: () => {
        this.guardando = false;
        this.dialog.closeAll();
        this.notify.success('Listo: el mes del hogar arranca el día ' + this.config.diaInicioMes);
      },
      error: err => {
        this.guardando = false;
        this.notify.error(mensajeDeError(err, 'No se pudo guardar.'));
      }
    });
  }

  /** Issue #35: código + QR para que otra persona cree su cuenta dentro de este hogar. */
  invitar() {
    this.generando = true;
    this.service.crearInvitacion().subscribe({
      next: (inv: Invitacion) => {
        this.generando = false;
        const enlace = `${location.origin}/login?invitacion=${inv.codigo}`;
        const qr = qrcode(0, 'M');
        qr.addData(enlace);
        qr.make();
        this.invitacion = {
          codigo: `${inv.codigo.slice(0, 3)}-${inv.codigo.slice(3)}`,
          expiraEn: inv.expiraEn,
          enlace,
          qr: qr.createDataURL(6, 4)
        };
        const ref = this.dialog.open(this.invitacionTpl, { width: '380px' });
        this.cerrarAlUsarse(ref);
      },
      error: (err) => {
        this.generando = false;
        this.notify.error(mensajeDeError(err, 'No se pudo generar la invitación.'));
      }
    });
  }

  /**
   * #57: quien invita no se entera de que el código ya se usó (escaneado o tipeado),
   * así que mientras el QR está abierto miramos si apareció alguien nuevo en el hogar.
   */
  private cerrarAlUsarse(ref: MatDialogRef<unknown>) {
    let antes: Set<string | undefined> | undefined;
    const sub = this.service.getPersonas(3000).subscribe(personas => {
      if (!antes) { antes = new Set(personas.map(p => p.id)); return; }
      const nueva = personas.find(p => !antes!.has(p.id));
      if (nueva) {
        ref.close();
        this.notify.success(`${nueva.nombre} se sumó al hogar`);
      }
    });
    ref.afterClosed().subscribe(() => sub.unsubscribe());
  }

  async compartirInvitacion() {
    const inv = this.invitacion!;
    const texto = `Sumate a nuestro hogar en Gastos Hogar. Código: ${inv.codigo}`;
    // En el celular abre el menú de compartir (WhatsApp, etc.); en la compu copia el enlace.
    if (navigator.share) {
      try { await navigator.share({ title: 'Gastos Hogar', text: texto, url: inv.enlace }); } catch { /* lo canceló */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${texto}\n${inv.enlace}`);
      this.notify.success('Enlace copiado');
    } catch {
      this.notify.error('No se pudo copiar. Pasá el código a mano.');
    }
  }

  ngOnInit() {
    this.personas$ = this.service.getPersonas();
  }

  openAddPersona() {
    this.dialog.open(PersonaFormComponent, {
      width: '400px'
    });
  }

  editPersona(persona: Persona) {
    this.dialog.open(PersonaFormComponent, {
      width: '400px',
      data: persona
    });
  }

  viewSummary(persona: Persona) {
    this.dialog.open(PersonaSummaryDialogComponent, {
      width: '600px',
      data: persona
    });
  }

  changePassword(persona: Persona) {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px',
      data: persona
    });
  }
}
