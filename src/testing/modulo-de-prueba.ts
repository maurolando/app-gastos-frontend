import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApolloTestingModule } from 'apollo-angular/testing';

/**
 * Lo que necesita cualquier componente para crearse en un test: Apollo sin red,
 * rutas, diálogos y avisos. NO_ERRORS_SCHEMA deja afuera los componentes de
 * Material del template: estos tests prueban que el componente se crea, no cómo se ve.
 */
export function moduloDePrueba(declarations: any[], dialogData: unknown = {}): TestModuleMetadata {
  return {
    declarations,
    imports: [ApolloTestingModule, RouterTestingModule, NoopAnimationsModule, MatSnackBarModule, MatDialogModule],
    providers: [
      { provide: MatDialogRef, useValue: { close: () => {}, afterClosed: () => ({ subscribe: () => {} }) } },
      { provide: MAT_DIALOG_DATA, useValue: dialogData },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  };
}
