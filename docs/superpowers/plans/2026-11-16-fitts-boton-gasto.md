# Botón de gasto (Fitts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que "+ Gasto" se pueda abrir desde cualquier pantalla con un objetivo grande y cerca del pulgar, y que el diálogo se pueda guardar con el pulgar.

**Architecture:** El botón vive en `AppComponent`, que ya tiene `esMovil$` y `currentUser$`. En el celular es un FAB fijo y en escritorio un botón ancho arriba del sidenav. Los dos llaman a `nuevoGasto()`, que abre `ExpenseFormComponent`. El diálogo solo cambia en template y SCSS.

**Tech Stack:** Angular + Angular Material, Karma/Jasmine (`ng test`), SCSS con los tokens de Atardecer.

**Spec:** `docs/superpowers/specs/2026-11-16-fitts-boton-gasto-design.md`

## Global Constraints
- FAB del celular: 60×60 px, `bottom: calc(16px + env(safe-area-inset-bottom))`, `right: 16px`, `aria-label="Nuevo gasto"`.
- Botón de escritorio: ancho completo, 52 px de alto, texto "Nuevo gasto" con ícono `add`.
- Guardar del diálogo: ancho completo, 52 px de alto. Cerrar: icon-button `close` de 48×48 arriba a la derecha del título, con `aria-label="Cancelar"`.
- Colores: solo los tokens existentes (`color="accent"`, variables de Atardecer). Nada de la paleta del CSS base.
- Node vía nvm: `export PATH=...` antes de `npm`/`ng`.

## Review Focus
- Teclado en pantalla abierto en el celular: el FAB no tiene que quedar encima del diálogo (los diálogos de Material van en un overlay con z-index mayor; verificar a ojo).
- Final de las listas en el celular: el último ítem tiene que poder verse por encima del FAB (`padding-bottom` en `.main-content`).
- Login o sesión cerrada: ni el FAB ni el botón del sidenav deben aparecer.
- Edición de un gasto: el diálogo con datos usa el mismo Guardar y la misma X.
- Formulario inválido: Guardar ancho sigue `[disabled]="form.invalid"`.

---

### Task 1: Botón global "+ Gasto"

**Files:**
- Modify: `src/app/app.component.ts` (inyectar `MatDialog`, agregar `nuevoGasto(): void`)
- Modify: `src/app/app.component.html` (FAB fuera del sidenav-container cuando `esMovil$`; botón ancho al inicio del `mat-nav-list` cuando no lo es; ambos dentro del bloque de `currentUser$`)
- Modify: `src/app/app.component.scss` (`.fab-gasto`, `.nuevo-gasto-lateral`, `padding-bottom` del `.main-content` en el celular)
- Modify: `src/app/components/expense-list/expense-list.component.{html,ts}` y `src/app/components/dashboard/dashboard.component.{html,ts}` (quitar el botón "Nuevo gasto" y `openAddExpense()`; quitar el import de `ExpenseFormComponent` solo si queda sin uso)
- Test: `src/app/app.component.spec.ts`

**Interfaces:**
- Produces: `AppComponent.nuevoGasto(): void` → `this.dialog.open(ExpenseFormComponent, { width: '450px' })`

- [ ] **Step 1: Test que falla**
```ts
it('nuevoGasto abre el formulario de gasto', () => {
  const fixture = TestBed.createComponent(AppComponent);
  const dialog = TestBed.inject(MatDialog);
  spyOn(dialog, 'open');
  fixture.componentInstance.nuevoGasto();
  expect(dialog.open).toHaveBeenCalledWith(ExpenseFormComponent, { width: '450px' });
});
```
- [ ] **Step 2:** `npx ng test --watch=false --include=src/app/app.component.spec.ts` → FAIL (`nuevoGasto` no existe)
- [ ] **Step 3:** Implementar el método, el template y el SCSS según las Global Constraints; quitar los botones viejos.
- [ ] **Step 4:** `npx ng test --watch=false` → todo PASS (incluidos los specs de dashboard y expense-list)
- [ ] **Step 5:** commit `feat: botón de nuevo gasto al alcance del pulgar (Fitts)`

### Task 2: Diálogo de gasto para el pulgar

**Files:**
- Modify: `src/app/components/expense-form/expense-form.component.html` (título + X en una fila; quitar "Cancelar" de `mat-dialog-actions`; Guardar con clase `guardar-ancho`)
- Modify: `src/app/components/expense-form/expense-form.component.scss`
- Test: `src/app/components/expense-form/expense-form.component.spec.ts`

- [ ] **Step 1: Test que falla**
```ts
it('cierra con una X arriba y guarda con un botón ancho abajo', () => {
  const el: HTMLElement = fixture.nativeElement;
  expect(el.querySelector('button[aria-label="Cancelar"][mat-dialog-close]')).not.toBeNull();
  expect(el.querySelector('mat-dialog-actions button.guardar-ancho')).not.toBeNull();
  expect(el.querySelectorAll('mat-dialog-actions button').length).toBe(1);
});
```
- [ ] **Step 2:** correr ese spec → FAIL
- [ ] **Step 3:** Cambiar el template y el SCSS (`.guardar-ancho { width: 100%; min-height: 52px; }`, X de 48×48)
- [ ] **Step 4:** `npx ng test --watch=false` → PASS; `npx ng build` → OK
- [ ] **Step 5:** commit `feat: diálogo de gasto con Guardar ancho abajo y cerrar arriba`

### Task 3: Verificación visual
- [ ] Levantar la app (skill del repo para arrancarla), revisar con Playwright en 390×844 y 1280×800: FAB visible y abre el diálogo, último ítem de Gastos visible, botón del sidenav en escritorio, nada en /login. Capturas al usuario.
