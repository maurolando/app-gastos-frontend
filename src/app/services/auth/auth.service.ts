import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Persona } from '../persona/persona.service';

const STORAGE_KEY = 'auth_persona';

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
    return raw ? JSON.parse(raw) : null;
  }

  getUsuarioActual(): Persona | null {
    return this.currentUserSubject.value;
  }

  iniciarSesion(persona: Persona, permanecer: boolean) {
    const data = JSON.stringify(persona);
    if (permanecer) {
      localStorage.setItem(STORAGE_KEY, data);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, data);
      localStorage.removeItem(STORAGE_KEY);
    }
    this.currentUserSubject.next(persona);
  }

  cerrarSesion() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  estaLogueado(): boolean {
    return this.currentUserSubject.value !== null;
  }

  esPermanente(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
}
