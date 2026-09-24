import type {
  Abogado,
  Bien as BienRow,
  Ley as LeyRow,
  Persona as PersonaRow,
  Prisma,
} from '@prisma/client';
import { prisma } from './prisma';
import type {
  Bien,
  HonorariosConfig,
  Ley,
  PerfilAbogado,
  Persona,
  ProcesoParticion,
} from '../types';

export const procesoInclude = {
  bienes: true,
  personas: true,
  costos: { include: { partes: true } },
  leyesAplicadas: { include: { ley: true } },
  resultados: true,
} satisfies Prisma.ProcesoInclude;

export type ProcesoConRelaciones = Prisma.ProcesoGetPayload<{
  include: typeof procesoInclude;
}>;

const HONORARIOS_POR_DEFECTO: HonorariosConfig = {
  viaProceso: 'notarial',
  abogadoPorcentaje: 10,
  agenciasDerechoPorcentaje: 15,
  juezCostasPorcentaje: 15,
  abogadoFijoCOP: 0,
  agenciasDerechoFijoCOP: 0,
  juezCostasFijoCOP: 0,
  modalidad: 'porcentaje',
  quienPagaId: '',
  quienPagaNombre: '',
  quienRecibeId: '',
  quienRecibeNombre: '',
  quienesPaganIds: [],
  quienesPaganNombres: [],
  quienesRecibenIds: [],
  quienesRecibenNombres: [],
  estadoAgencias: 'estimado',
};

// -------------------------------------------------------------
// ABOGADO <-> PerfilAbogado
// -------------------------------------------------------------

export function abogadoToPerfil(a: Abogado): PerfilAbogado {
  return {
    id: a.id,
    nombre: a.nombreCompleto,
    tarjetaProfesional: a.tarjetaProfesional ?? '',
    documentoIdentidad: a.documentoIdentidad ?? '',
    despachoFirma: a.despacho ?? '',
    sitioWeb: a.paginaWeb ?? undefined,
    correo: a.correo,
    telefono: a.telefono ?? '',
    ciudad: a.ciudad ?? '',
    especialidad: a.areaEspecialidad ?? '',
    fotoPerfil: a.fotoPerfilUrl ?? undefined,
    registrado: true,
  };
}

// -------------------------------------------------------------
// ENUM <-> DTO
// -------------------------------------------------------------

function tipoProcesoAActivo(tipo: string): ProcesoConRelaciones['tipoProceso'] {
  const t = (tipo || '').toLowerCase();
  if (t.includes('conyugal') || t.includes('sociedad')) return 'SOCIEDAD_CONYUGAL';
  if (t.includes('disolución') || t.includes('disolucion') || t.includes('societaria')) {
    return 'DISOLUCION_SOCIETARIA';
  }
  if (t.includes('copropiedad') || t.includes('comunidad')) return 'COPROPIEDAD';
  return 'SUCESION';
}

function tipoProcesoAEtiqueta(tipo: ProcesoConRelaciones['tipoProceso']): string {
  switch (tipo) {
    case 'SOCIEDAD_CONYUGAL':
      return 'Liquidación de Sociedad Conyugal';
    case 'DISOLUCION_SOCIETARIA':
      return 'Disolución y Liquidación Societaria';
    case 'COPROPIEDAD':
      return 'División de Copropiedad';
    default:
      return 'Sucesión';
  }
}

function tipoSucesionAActivo(regimen?: string): ProcesoConRelaciones['tipoSucesion'] {
  if (regimen === 'intestado') return 'INTESTADA';
  if (regimen === 'testado') return 'TESTADA';
  return null;
}

function regimenSucesoralAEtiqueta(
  tipo: ProcesoConRelaciones['tipoSucesion']
): ProcesoParticion['regimenSucesoral'] {
  if (tipo === 'TESTADA') return 'testado';
  if (tipo === 'INTESTADA') return 'intestado';
  return undefined;
}

function viaProcesoAActivo(via?: string): ProcesoConRelaciones['viaProceso'] {
  return via === 'judicial' ? 'JUDICIAL' : 'NOTARIAL';
}

function tipoRelacionAActivo(persona: Persona): PersonaRow['tipoRelacion'] {
  if (persona.tipoRelacion === 'Amigo/Socio') return 'AMIGO';
  switch ((persona.parentesco || '').toLowerCase()) {
    case 'cónyuge':
    case 'conyuge':
      return 'CONYUGE';
    case 'hijo':
      return 'HIJO';
    case 'padre':
      return 'PADRE';
    case 'hermano':
      return 'HERMANO';
    case 'abuelo':
      return 'ABUELO';
    case 'sobrino':
      return 'SOBRINO';
    case 'tío':
    case 'tio':
      return 'TIO';
    case 'primo':
      return 'PRIMO';
    default:
      return 'OTRO';
  }
}

function tipoRelacionAEtiqueta(tipo: PersonaRow['tipoRelacion']): Persona['tipoRelacion'] {
  return tipo === 'AMIGO' || tipo === 'SOCIO' ? 'Amigo/Socio' : 'Familiar';
}

function parentescoAActivo(parentesco?: string): PersonaRow['parentesco'] {
  switch ((parentesco || '').toLowerCase()) {
    case 'cónyuge':
    case 'conyuge':
      return 'CONYUGE';
    case 'hijo':
      return 'HIJO';
    case 'padre':
      return 'PADRE';
    case 'hermano':
      return 'HERMANO';
    case 'abuelo':
      return 'ABUELO';
    case 'sobrino':
      return 'SOBRINO';
    case 'tío':
    case 'tio':
      return 'TIO';
    case 'primo':
      return 'PRIMO';
    default:
      return null;
  }
}

function parentescoAEtiqueta(
  tipo: string | null
): 'Cónyuge' | 'Hijo' | 'Padre' | 'Hermano' | 'Otro' {
  switch (tipo) {
    case 'CONYUGE':
      return 'Cónyuge';
    case 'HIJO':
      return 'Hijo';
    case 'PADRE':
      return 'Padre';
    case 'HERMANO':
      return 'Hermano';
    default:
      return 'Otro';
  }
}

function aplicaAActivo(aplicaA: Ley['aplicaA']): LeyRow['aplicaA'] {
  switch (aplicaA) {
    case 'Todas':
      return null;
    case 'Amigo/Socio':
      return 'AMIGO';
    case 'Cónyuge':
      return 'CONYUGE';
    case 'Hijo':
      return 'HIJO';
    case 'Padre':
      return 'PADRE';
    case 'Hermano':
      return 'HERMANO';
    default:
      return 'OTRO';
  }
}

function aplicaAEtiqueta(aplicaA: LeyRow['aplicaA']): Ley['aplicaA'] {
  if (!aplicaA) return 'Todas';
  if (aplicaA === 'AMIGO' || aplicaA === 'SOCIO') return 'Amigo/Socio';
  return parentescoAEtiqueta(aplicaA);
}

function grupoLeyDesdeNombre(nombre: string): LeyRow['grupo'] {
  const n = nombre.toLowerCase();
  if (n.includes('intestado') || n.includes('orden sucesoral')) return 'REPARTO_INTESTADO';
  return 'REPARTO_TESTADO';
}

// -------------------------------------------------------------
// PROCESO <-> ProcesoParticion
// -------------------------------------------------------------

function costosToHonorarios(p: ProcesoConRelaciones): HonorariosConfig {
  const base: HonorariosConfig = { ...HONORARIOS_POR_DEFECTO };
  base.viaProceso = p.viaProceso === 'JUDICIAL' ? 'judicial' : 'notarial';

  const abogado = p.costos.find((c) => c.tipo === 'HONORARIOS_ABOGADO');
  if (abogado) {
    base.modalidad = abogado.modalidad === 'MONTO_FIJO' ? 'fijo' : 'porcentaje';
    base.abogadoPorcentaje = abogado.porcentaje ?? (abogado.modalidad === 'MONTO_FIJO' ? 0 : 10);
    base.abogadoFijoCOP = abogado.montoFijo ?? 0;
  }

  const agencias = p.costos.find((c) => c.tipo === 'AGENCIAS_DERECHO');
  if (agencias) {
    if (agencias.modalidad === 'MONTO_FIJO') {
      base.agenciasDerechoFijoCOP = agencias.montoFijo ?? 0;
      base.agenciasDerechoPorcentaje = agencias.porcentaje ?? 0;
    } else {
      base.agenciasDerechoPorcentaje = agencias.porcentaje ?? 15;
      base.agenciasDerechoFijoCOP = agencias.montoFijo ?? 0;
    }
    base.estadoAgencias =
      agencias.estadoFijacion === 'CONFIRMADO_SENTENCIA' ? 'confirmado' : 'estimado';

    const pagadores = agencias.partes.filter((pt) => pt.rol === 'QUIEN_PAGA');
    const receptores = agencias.partes.filter((pt) => pt.rol === 'QUIEN_RECIBE');
    base.quienesPaganIds = pagadores.map((pt) => pt.personaId);
    base.quienesPaganNombres = pagadores.map(
      (pt) => p.personas.find((pp) => pp.id === pt.personaId)?.nombre ?? pt.personaId
    );
    base.quienesRecibenIds = receptores.map((pt) => pt.personaId);
    base.quienesRecibenNombres = receptores.map(
      (pt) => p.personas.find((pp) => pp.id === pt.personaId)?.nombre ?? pt.personaId
    );
  }

  return base;
}

export function procesoToDto(p: ProcesoConRelaciones): ProcesoParticion {
  const personas: Persona[] = p.personas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipoRelacion: tipoRelacionAEtiqueta(r.tipoRelacion),
    parentesco: r.parentesco ? parentescoAEtiqueta(r.parentesco) : undefined,
    declaradoIndigno: r.esIndigno,
    desheredado: r.esDesheredado,
    porcentajeParticipacion: r.porcentajeEscritura ?? undefined,
  }));

  const bienes: Bien[] = p.bienes.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    valor: r.valorComercial,
    asignadoAId: undefined,
  }));

  const leyes: Ley[] = p.leyesAplicadas.map((r) => ({
    id: r.ley.id,
    nombre: r.ley.nombre,
    porcentaje: r.porcentajeCaso,
    aplicaA: aplicaAEtiqueta(r.ley.aplicaA),
    activa: r.activa,
    descripcion: r.ley.descripcion ?? undefined,
    leyPadreId: r.baseCalculoLeyId ?? undefined,
  }));

  return {
    id: p.id,
    nombreCaso: p.nombreCaso,
    tipoProceso: tipoProcesoAEtiqueta(p.tipoProceso),
    regimenSucesoral: regimenSucesoralAEtiqueta(p.tipoSucesion),
    tieneCapitulaciones: false,
    porcentajeGanancialesCapitulaciones: 50,
    calcularGananciaOcasional: true,
    tarifaGananciaOcasionalPct: 15,
    fechaCreacion: p.fechaCreacion.toISOString(),
    fechaUltimaEdicion: p.fechaActualizacion.toISOString(),
    finalizado: p.estado === 'FINALIZADO',
    pasoActual: 1,
    bienes,
    leyes,
    personas,
    honorarios: costosToHonorarios(p),
  };
}

// -------------------------------------------------------------
// ProcesoParticion <-> PRISMA (escritura)
// -------------------------------------------------------------

function procesoScalarData(dto: ProcesoParticion): Prisma.ProcesoUncheckedUpdateInput {
  const patrimonioBruto = (dto.bienes ?? []).reduce((acc, b) => acc + (Number(b.valor) || 0), 0);
  return {
    nombreCaso: dto.nombreCaso ?? '',
    tipoProceso: tipoProcesoAActivo(dto.tipoProceso),
    tipoSucesion: tipoSucesionAActivo(dto.regimenSucesoral),
    viaProceso: viaProcesoAActivo(dto.honorarios?.viaProceso),
    estado: dto.finalizado === true ? 'FINALIZADO' : 'PENDIENTE',
    patrimonioBruto,
    patrimonioNeto: patrimonioBruto,
    fechaCreacion: new Date(dto.fechaCreacion),
    fechaActualizacion: new Date(dto.fechaUltimaEdicion ?? dto.fechaCreacion),
    fechaFinalizacion:
      dto.finalizado === true ? new Date(dto.fechaUltimaEdicion ?? dto.fechaCreacion) : null,
  };
}

function procesoLeyesNested(dto: ProcesoParticion): Prisma.ProcesoLeyCreateNestedManyWithoutProcesoInput {
  return {
    create: (dto.leyes ?? []).map((l) => ({
      leyId: l.id,
      porcentajeCaso: l.porcentaje ?? 0,
      activa: l.activa ?? true,
      baseCalculoLeyId: l.leyPadreId ?? null,
    })),
  };
}

function personasNested(dto: ProcesoParticion): Prisma.PersonaCreateNestedManyWithoutProcesoInput {
  return {
    create: (dto.personas ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      tipoRelacion: tipoRelacionAActivo(p),
      parentesco: parentescoAActivo(p.parentesco),
      porcentajeEscritura: p.porcentajeParticipacion ?? null,
      esIndigno: p.declaradoIndigno ?? false,
      esDesheredado: p.desheredado ?? false,
    })),
  };
}

function bienesNested(dto: ProcesoParticion): Prisma.BienCreateNestedManyWithoutProcesoInput {
  return {
    create: (dto.bienes ?? []).map((b) => ({
      id: b.id,
      nombre: b.nombre,
      valorComercial: Number(b.valor) || 0,
      categoria: 'OTRO',
      esBienPropio: false,
    })),
  };
}

function costosNested(dto: ProcesoParticion): Prisma.CostoProcesoCreateNestedManyWithoutProcesoInput {
  const personaIds = new Set((dto.personas ?? []).map((p) => p.id));

  const costoAbogado: Prisma.CostoProcesoCreateWithoutProcesoInput = {
    tipo: 'HONORARIOS_ABOGADO',
    modalidad: dto.honorarios?.modalidad === 'fijo' ? 'MONTO_FIJO' : 'PORCENTAJE',
    porcentaje: dto.honorarios?.abogadoPorcentaje ?? 10,
    montoFijo: dto.honorarios?.abogadoFijoCOP ?? 0,
  };

  const partesInput: Array<{ personaId: string; rol: 'QUIEN_PAGA' | 'QUIEN_RECIBE' }> = [];
  for (const id of dto.honorarios?.quienesPaganIds ?? []) {
    if (personaIds.has(id)) partesInput.push({ personaId: id, rol: 'QUIEN_PAGA' });
  }
  if (dto.honorarios?.quienPagaId && personaIds.has(dto.honorarios.quienPagaId)) {
    partesInput.push({ personaId: dto.honorarios.quienPagaId, rol: 'QUIEN_PAGA' });
  }
  for (const id of dto.honorarios?.quienesRecibenIds ?? []) {
    if (personaIds.has(id)) partesInput.push({ personaId: id, rol: 'QUIEN_RECIBE' });
  }
  if (dto.honorarios?.quienRecibeId && personaIds.has(dto.honorarios.quienRecibeId)) {
    partesInput.push({ personaId: dto.honorarios.quienRecibeId, rol: 'QUIEN_RECIBE' });
  }
  const partesUnicas = partesInput.filter(
    (pt, idx) =>
      partesInput.findIndex((o) => o.personaId === pt.personaId && o.rol === pt.rol) === idx
  );
  const partes: Prisma.CostoProcesoParteCreateWithoutCostoProcesoInput[] = partesUnicas.map(
    (pt) => ({ persona: { connect: { id: pt.personaId } }, rol: pt.rol })
  );

  const agenciasFijo = (dto.honorarios?.agenciasDerechoFijoCOP ?? 0) > 0;
  const costoAgencias: Prisma.CostoProcesoCreateWithoutProcesoInput = {
    tipo: 'AGENCIAS_DERECHO',
    modalidad: agenciasFijo ? 'MONTO_FIJO' : 'PORCENTAJE',
    porcentaje: agenciasFijo ? null : (dto.honorarios?.agenciasDerechoPorcentaje ?? 15),
    montoFijo: agenciasFijo ? (dto.honorarios?.agenciasDerechoFijoCOP ?? 0) : null,
    estadoFijacion:
      dto.honorarios?.estadoAgencias === 'confirmado' ? 'CONFIRMADO_SENTENCIA' : 'ESTIMADO',
    partes: partesUnicas.length > 0 ? { create: partesUnicas } : undefined,
  };

  return { create: [costoAbogado, costoAgencias] };
}

/** Asegura que las leyes referenciadas existan en el catálogo global. */
async function asegurarCatalogoLeyes(leyes: Ley[]): Promise<void> {
  for (const l of leyes) {
    await prisma.ley.upsert({
      where: { id: l.id },
      update: {
        nombre: l.nombre,
        porcentajeBase: l.porcentaje ?? 0,
        aplicaA: aplicaAActivo(l.aplicaA),
        descripcion: l.descripcion ?? null,
        activaPorDefecto: l.activa ?? true,
      },
      create: {
        id: l.id,
        nombre: l.nombre,
        porcentajeBase: l.porcentaje ?? 0,
        aplicaA: aplicaAActivo(l.aplicaA),
        descripcion: l.descripcion ?? null,
        grupo: grupoLeyDesdeNombre(l.nombre),
        activaPorDefecto: l.activa ?? true,
      },
    });
  }
}

async function obtenerProcesoConRelacionesDb(id: string): Promise<ProcesoConRelaciones | null> {
  return prisma.proceso.findUnique({
    where: { id },
    include: procesoInclude,
  });
}

/**
 * Crea o reemplaza por completo un proceso (upsert) con sus bienes, personas,
 * leyes aplicadas, costos y resultados asociados.
 */
export async function upsertProceso(dto: ProcesoParticion): Promise<ProcesoConRelaciones> {
  await asegurarCatalogoLeyes(dto.leyes ?? []);

  const existe = await prisma.proceso.findUnique({ where: { id: dto.id } });

  if (existe) {
    await prisma.proceso.update({
      where: { id: dto.id },
      data: {
        ...procesoScalarData(dto),
        bienes: { deleteMany: {}, ...bienesNested(dto) },
        personas: { deleteMany: {}, ...personasNested(dto) },
        leyesAplicadas: { deleteMany: {}, ...procesoLeyesNested(dto) },
        costos: { deleteMany: {}, ...costosNested(dto) },
        resultados: { deleteMany: {} },
      },
    });
  } else {
    await prisma.proceso.create({
      data: {
        id: dto.id,
        nombreCaso: dto.nombreCaso ?? '',
        tipoProceso: tipoProcesoAActivo(dto.tipoProceso),
        tipoSucesion: tipoSucesionAActivo(dto.regimenSucesoral),
        viaProceso: viaProcesoAActivo(dto.honorarios?.viaProceso),
        estado: dto.finalizado === true ? 'FINALIZADO' : 'PENDIENTE',
        patrimonioBruto: (dto.bienes ?? []).reduce((acc, b) => acc + (Number(b.valor) || 0), 0),
        patrimonioNeto: 0,
        fechaCreacion: new Date(dto.fechaCreacion),
        bienes: bienesNested(dto),
        personas: personasNested(dto),
        leyesAplicadas: procesoLeyesNested(dto),
        costos: costosNested(dto),
      },
    });
  }

  const registro = await obtenerProcesoConRelacionesDb(dto.id);
  if (!registro) {
    throw new Error('No se pudo guardar el proceso.');
  }
  return registro;
}

export async function obtenerProcesoConRelaciones(id: string): Promise<ProcesoConRelaciones | null> {
  return obtenerProcesoConRelacionesDb(id);
}