import { Component, OnInit } from '@angular/core';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
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

  constructor(private service: PersonaService, private dialog: MatDialog) {}

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
