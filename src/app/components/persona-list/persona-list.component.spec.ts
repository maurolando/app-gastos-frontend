import { Subject } from 'rxjs';
import { PersonaListComponent } from './persona-list.component';
import { Persona } from 'src/app/services/persona/persona.service';

describe('PersonaListComponent', () => {
  // #57: el QR de invitación se cierra cuando alguien nuevo entra al hogar.
  it('cierra el QR cuando aparece una persona nueva en el hogar', () => {
    const personas = new Subject<Persona[]>();
    const cerrado = new Subject<void>();
    const service = jasmine.createSpyObj('PersonaService', { getPersonas: personas });
    const notify = jasmine.createSpyObj('NotificationService', ['success']);
    const ref = jasmine.createSpyObj('MatDialogRef', { close: undefined, afterClosed: cerrado });
    const component = new PersonaListComponent(service, {} as any, notify, {} as any, {} as any);

    (component as any).cerrarAlUsarse(ref);
    personas.next([{ id: '1', nombre: 'Ana' }]);
    personas.next([{ id: '1', nombre: 'Ana' }]);
    expect(ref.close).not.toHaveBeenCalled();

    personas.next([{ id: '1', nombre: 'Ana' }, { id: '2', nombre: 'Beto' }]);
    expect(ref.close).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith('Beto se sumó al hogar');
    expect(service.getPersonas).toHaveBeenCalledWith(3000);

    cerrado.next();
    expect(personas.observed).toBeFalse();
  });
});
