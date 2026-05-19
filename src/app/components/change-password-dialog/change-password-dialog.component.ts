import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PersonaService, Persona } from 'src/app/services/persona/persona.service';
import { NotificationService } from 'src/app/services/notification/notification.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('nueva')?.value;
  const confirmar = control.get('confirmar')?.value;
  return nueva === confirmar ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent {
  form: FormGroup;
  showNueva = false;
  showConfirmar = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private notify: NotificationService,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public persona: Persona
  ) {
    this.form = this.fb.group({
      nueva: ['', [Validators.required, Validators.minLength(3)]],
      confirmar: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  guardar() {
    if (this.form.invalid) return;
    this.loading = true;
    this.personaService.setClave(this.persona.id!, this.form.value.nueva).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success(`Contraseña de ${this.persona.nombre} actualizada`);
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.notify.error('Error al cambiar la contraseña');
      }
    });
  }
}
