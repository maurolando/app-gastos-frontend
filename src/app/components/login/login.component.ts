import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonaService } from 'src/app/services/persona/persona.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { NotificationService } from 'src/app/services/notification/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      clave: ['', [Validators.required, Validators.minLength(3)]],
      permanecer: [false]
    });
  }

  login() {
    if (this.form.invalid) return;
    this.loading = true;
    const { nombre, clave, permanecer } = this.form.value;

    this.personaService.loginPersona(nombre, clave).subscribe({
      next: (resultado) => {
        this.loading = false;
        if (resultado?.token) {
          this.authService.iniciarSesion(resultado.persona, resultado.token, permanecer);
          this.notify.success(`¡Bienvenido, ${resultado.persona.nombre}!`);
          this.router.navigate(['/']);
        } else {
          this.notify.error('Usuario o contraseña incorrectos');
        }
      },
      error: () => {
        this.loading = false;
        this.notify.error('Error al conectar. Verifica que el servidor esté activo.');
      }
    });
  }
}
