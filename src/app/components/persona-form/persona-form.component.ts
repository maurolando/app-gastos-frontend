import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
import { NotificationService } from 'src/app/services/notification/notification.service';

@Component({
  selector: 'app-persona-form',
  templateUrl: './persona-form.component.html',
  styleUrls: ['./persona-form.component.scss']
})
export class PersonaFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private service: PersonaService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<PersonaFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Persona
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      activo: [true]
    });
  }

  ngOnInit() {
    if (this.data) {
      this.isEdit = true;
      this.form.patchValue({
        nombre: this.data.nombre,
        activo: this.data.activo
      });
    }
  }

  save() {
    if (this.form.valid) {
      if (this.isEdit && this.data.id) {
        this.service.updatePersona(this.data.id, this.form.value.nombre, this.form.value.activo).subscribe(() => {
          this.notify.success('Persona actualizada correctamente');
          this.dialogRef.close(true);
        });
      } else {
        this.service.createPersona(this.form.value.nombre).subscribe(() => {
          this.notify.success('Persona creada con éxito');
          this.dialogRef.close(true);
        });
      }
    }
  }
}
