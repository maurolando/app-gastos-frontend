import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Persona } from '../persona/persona.service';

const STORAGE_KEY = 'auth_persona';
const TOKEN_KEY = 'auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Persona | null>(this.loadFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  private loadFromStorage(): Persona | null {
    // Busca primero en localStorage (permanente), luego en sessionStorage (temporal)
    const local = localStorage.getItem(STORAGE_KEY);
    const session = sessionStorage.getItem(STORAGE_KEY);
    const raw = local || session;

    // Sin token la sesión no sirve: el backend rechaza todo con "No autenticado".
    // Mostrar al usuario como logueado en ese caso lo deja en una app donde nada
    // carga y el botón de salir es la única salida, sin nada que lo explique.
    if (!raw || !this.getToken()) {
      this.limpiarAlmacenamiento();
      return null;
    }

    return JSON.parse(raw);
  }

  getUsuarioActual(): Persona | null {
    return this.currentUserSubject.value;
  }

  /** Lo lee el enlace de Apollo en cada request para firmar la llamada. */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  iniciarSesion(persona: Persona, token: string, permanecer: boolean) {
    const data = JSON.stringify(persona);
    if (permanecer) {
      localStorage.setItem(STORAGE_KEY, data);
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, data);
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    this.currentUserSubject.next(persona);
  }

  cerrarSesion() {
    this.limpiarAlmacenamiento();
    this.currentUserSubject.next(null);
  }

  private limpiarAlmacenamiento() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  estaLogueado(): boolean {
    return this.currentUserSubject.value !== null;
  }

  esPermanente(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}
