/**
 * Guía de distribución del ingreso: grupos de gasto, plantillas y textos
 * explicativos para el usuario. Los cálculos viven en el backend.
 */

export type GrupoGasto = 'NECESIDADES' | 'DESEOS' | 'EDUCACION' | 'AHORRO' | 'INVERSION' | 'DONACIONES';

export type PlantillaRegla = 'REGLA_70_20_10' | 'REGLA_50_30_20' | 'SEIS_JARRAS' | 'PERSONALIZADA';

export interface InfoGrupo {
  valor: GrupoGasto;
  nombre: string;
  icono: string;
  descripcion: string;
}

export interface InfoPlantilla {
  valor: PlantillaRegla;
  nombre: string;
  resumen: string;
  descripcion: string;
}

export const GRUPOS: InfoGrupo[] = [
  {
    valor: 'NECESIDADES', nombre: 'Necesidades', icono: 'home',
    descripcion: 'Lo indispensable: alquiler, supermercado, luz, agua, transporte, salud y las cuotas mínimas de tus deudas.'
  },
  {
    valor: 'DESEOS', nombre: 'Deseos', icono: 'celebration',
    descripcion: 'Lo que mejora tu vida pero se puede recortar: salidas, delivery, streaming, ropa que no hace falta, viajes.'
  },
  {
    valor: 'EDUCACION', nombre: 'Educación', icono: 'school',
    descripcion: 'Facultad, cursos, libros y capacitaciones.'
  },
  {
    valor: 'AHORRO', nombre: 'Ahorro', icono: 'savings',
    descripcion: 'Fondo de emergencia, metas grandes y pagos extra para cancelar deudas antes de tiempo.'
  },
  {
    valor: 'INVERSION', nombre: 'Inversión', icono: 'trending_up',
    descripcion: 'CDA, fondos de inversión o un negocio: dinero que genera más dinero.'
  },
  {
    valor: 'DONACIONES', nombre: 'Donaciones', icono: 'volunteer_activism',
    descripcion: 'Ayuda a la familia, iglesia, causas benéficas y regalos.'
  }
];

export const PLANTILLAS: InfoPlantilla[] = [
  {
    valor: 'REGLA_70_20_10', nombre: '70 / 20 / 10',
    resumen: '70% necesidades · 20% ahorro · 10% deseos',
    descripcion: 'La más realista si el ingreso del hogar es bajo o hay familia a cargo: prioriza cubrir lo básico sin dejar de ahorrar.'
  },
  {
    valor: 'REGLA_50_30_20', nombre: '50 / 30 / 20',
    resumen: '50% necesidades · 30% deseos · 20% ahorro',
    descripcion: 'La regla clásica. Funciona bien desde unos dos salarios mínimos de ingreso en el hogar.'
  },
  {
    valor: 'SEIS_JARRAS', nombre: '6 jarras',
    resumen: '55% necesidades · 10% educación · 10% ocio · 10% ahorro · 10% inversión · 5% dar',
    descripcion: 'Para quien ya cubre lo básico y quiere separar educación, inversión y donaciones.'
  },
  {
    valor: 'PERSONALIZADA', nombre: 'Personalizada',
    resumen: 'Vos definís el porcentaje de cada grupo',
    descripcion: 'Ajustá los porcentajes a la realidad de tu hogar. Tienen que sumar 100%.'
  }
];

export function nombrePlantilla(valor: PlantillaRegla | null | undefined): string {
  return PLANTILLAS.find(p => p.valor === valor)?.nombre ?? '';
}

export function nombreGrupo(valor: GrupoGasto | null | undefined): string {
  return GRUPOS.find(g => g.valor === valor)?.nombre ?? 'Sin clasificar';
}

/**
 * Los errores de validación del backend (BAD_REQUEST) traen un mensaje escrito
 * para el usuario, por ejemplo "Los porcentajes tienen que sumar 100%". El
 * resto no, así que para esos se muestra el texto por defecto.
 */
export function mensajeDeError(err: any, porDefecto: string): string {
  const validacion = err?.graphQLErrors?.find((e: any) => e?.extensions?.classification === 'BAD_REQUEST');
  return validacion?.message || porDefecto;
}
