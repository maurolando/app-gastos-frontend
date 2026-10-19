import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { Persona, PersonaService } from 'src/app/services/persona/persona.service';
import { AuthService } from 'src/app/services/auth/auth.service';
import { NotificationService } from 'src/app/services/notification/notification.service';
import { mensajeDeError } from 'src/app/utils/distribucion.util';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  /** Crear cuenta arma un hogar nuevo y vacío: sus gastos no se mezclan con los de otro. */
  registrando = false;

  constructor(
    private fb: FormBuilder,
    private personaService: PersonaService,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router,
    private apollo: Apollo
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      clave: ['', [Validators.required, Validators.minLength(3)]],
      confirmar: [''],
      permanecer: [false]
    }, { validators: (g: AbstractControl) => this.clavesCoinciden(g) });
  }

  cambiarModo() {
    this.registrando = !this.registrando;
    // Las cuentas nuevas piden 6 como el backend; el login acepta las claves cortas de antes.
    this.form.get('clave')!.setValidators([Validators.required, Validators.minLength(this.registrando ? 6 : 3)]);
    this.form.get('clave')!.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  private clavesCoinciden(g: AbstractControl): ValidationErrors | null {
    if (!this.registrando) return null;
    return g.get('clave')?.value === g.get('confirmar')?.value ? null : { noCoinciden: true };
  }

  enviar() {
    if (this.form.invalid) return;
    this.registrando ? this.registrar() : this.login();
  }

  private login() {
    this.loading = true;
    const { nombre, clave } = this.form.value;

    this.personaService.loginPersona(nombre, clave).subscribe({
      next: (resultado) => {
        this.loading = false;
        if (resultado?.token) {
          this.entrar(resultado.persona, resultado.token, `¡Bienvenido, ${resultado.persona.nombre}!`);
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

  private registrar() {
    this.loading = true;
    const { nombre, clave } = this.form.value;

    this.personaService.registrar(nombre, clave).subscribe({
      next: (resultado) => {
        this.loading = false;
        this.entrar(resultado.persona, resultado.token, `¡Cuenta creada! Bienvenido, ${resultado.persona.nombre}`);
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(mensajeDeError(err, 'No se pudo crear la cuenta. Verifica que el servidor esté activo.'));
      }
    });
  }

  private async entrar(persona: Persona, token: string, mensaje: string) {
    // La caché de Apollo puede traer datos de otra cuenta usada en este navegador.
    await this.apollo.client.clearStore();
    this.authService.iniciarSesion(persona, token, this.form.value.permanecer);
    this.notify.success(mensaje);
    this.router.navigate(['/']);
  }
}
