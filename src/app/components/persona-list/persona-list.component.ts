import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import qrcode from 'qrcode-generator';
import { PersonaService, Persona, Invitacion } from 'src/app/services/persona/persona.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { mensajeDeError } from 'src/app/utils/distribucion.util';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PersonaFormComponent } from '../persona-form/persona-form.component';
import { PersonaSummaryDialogComponent } from '../persona-summary-dialog/persona-summary-dialog.component';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';

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

  constructor(private service: PersonaService, private dialog: MatDialog, private notify: NotificationService) {}

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
        this.dialog.open(this.invitacionTpl, { width: '380px' });
      },
      error: (err) => {
        this.generando = false;
        this.notify.error(mensajeDeError(err, 'No se pudo generar la invitación.'));
      }
    });
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
