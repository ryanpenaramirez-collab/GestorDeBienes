import type {
  Abogado,
  Bien as BienRow,
  CasoFinalizado as CasoFinalizadoRow,
  CostoProceso,
  Ley as LeyRow,
  Persona as PersonaRow,
  Proceso,
  Prisma,
} from '@prisma/client';
import type {
  Bien,
  CasoFinalizado,
  HonorariosConfig,
  Ley,
  PerfilAbogado,
  Persona,
  ProcesoParticion,
  ResultadoParticion,
} from '../types';
import { decodeJson, decodeJsonArray, encodeJsonArray } from './json';
import { prisma } from './prisma';

export const procesoInclude = {
  bienes: true,
  personas: true,
  leyes: true,
  costo: true,
} satisfies Prisma.ProcesoInclude;

export type ProcesoConRelaciones = Proceso & {
  bienes: BienRow[];
  personas: PersonaRow[];
  leyes: LeyRow[];
  costo: CostoProceso | null;
};

const HONORARIOS_POR_DEFECTO: HonorariosConfig = {
  viaProceso: 'judicial',
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

export function abogadoToPerfil(a: Abogado): PerfilAbogado {
  return {
    id: a.id,
    nombre: a.nombre,
    tarjetaProfesional: a.tarjetaProfesional,
    documentoIdentidad: a.documentoIdentidad,
    despachoFirma: a.despachoFirma,
    sitioWeb: a.sitioWeb ?? undefined,
    correo: a.correo,
    telefono: a.telefono,
    ciudad: a.ciudad,
    especialidad: a.especialidad,
    leyendaNotarial: a.leyendaNotarial ?? undefined,
    fotoPerfil: a.fotoPerfil ?? undefined,
    registrado: a.registrado,
  };
}

export function costoToHonorarios(c?: CostoProceso | null): HonorariosConfig {
  if (!c) return { ...HONORARIOS_POR_DEFECTO };
  return {
    viaProceso: (c.viaProceso as HonorariosConfig['viaProceso']) ?? 'judicial',
    modalidad: (c.modalidad as HonorariosConfig['modalidad']) ?? 'porcentaje',
    abogadoPorcentaje: c.abogadoPorcentaje ?? 10,
    agenciasDerechoPorcentaje: c.agenciasDerechoPorcentaje ?? 15,
    juezCostasPorcentaje: c.juezCostasPorcentaje ?? undefined,
    abogadoFijoCOP: c.abogadoFijoCOP ?? 0,
    agenciasDerechoFijoCOP: c.agenciasDerechoFijoCOP ?? 0,
    juezCostasFijoCOP: c.juezCostasFijoCOP ?? undefined,
    quienPagaId: c.quienPagaId ?? '',
    quienPagaNombre: c.quienPagaNombre ?? '',
    quienRecibeId: c.quienRecibeId ?? '',
    quienRecibeNombre: c.quienRecibeNombre ?? '',
    quienesPaganIds: decodeJsonArray<string>(c.quienesPaganIds),
    quienesPaganNombres: decodeJsonArray<string>(c.quienesPaganNombres),
    quienesRecibenIds: decodeJsonArray<string>(c.quienesRecibenIds),
    quienesRecibenNombres: decodeJsonArray<string>(c.quienesRecibenNombres),
    estadoAgencias: (c.estadoAgencias as HonorariosConfig['estadoAgencias']) ?? 'estimado',
  };
}

export function procesoToDto(p: ProcesoConRelaciones): ProcesoParticion {
  const personas: Persona[] = p.personas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    tipoRelacion: (r.tipoRelacion as Persona['tipoRelacion']) ?? 'Familiar',
    parentesco: r.parentesco as Persona['parentesco'],
    bienesAsignadosIds: decodeJsonArray<string>(r.bienesAsignadosIds),
    declaradoIndigno: r.declaradoIndigno,
    desheredado: r.desheredado,
    porcentajeParticipacion: r.porcentajeParticipacion ?? undefined,
  }));

  const bienes: Bien[] = p.bienes.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    valor: r.valor,
    asignadoAId: r.asignadoAId ?? undefined,
  }));

  const leyes: Ley[] = p.leyes.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    porcentaje: r.porcentaje,
    aplicaA: (r.aplicaA as Ley['aplicaA']) ?? 'Todas',
    activa: r.activa,
    descripcion: r.descripcion ?? undefined,
    baseCalculo: r.baseCalculo as Ley['baseCalculo'],
    leyPadreId: r.leyPadreId ?? undefined,
  }));

  return {
    id: p.id,
    nombreCaso: p.nombreCaso,
    tipoProceso: p.tipoProceso,
    regimenSucesoral: (p.regimenSucesoral as ProcesoParticion['regimenSucesoral']),
    tieneCapitulaciones: p.tieneCapitulaciones,
    porcentajeGanancialesCapitulaciones: p.porcentajeGanancialesCapitulaciones,
    calcularGananciaOcasional: p.calcularGananciaOcasional,
    tarifaGananciaOcasionalPct: p.tarifaGananciaOcasionalPct,
    fechaCreacion: p.fechaCreacion.toISOString(),
    fechaUltimaEdicion: p.fechaUltimaEdicion.toISOString(),
    finalizado: p.finalizado,
    pasoActual: p.pasoActual as 1 | 2 | 3,
    bienes,
    leyes,
    personas,
    honorarios: costoToHonorarios(p.costo),
  };
}

function costoToCreateData(h: HonorariosConfig): Prisma.CostoProcesoUncheckedCreateWithoutProcesoInput {
  return {
    viaProceso: h.viaProceso ?? null,
    modalidad: h.modalidad ?? 'porcentaje',
    abogadoPorcentaje: h.abogadoPorcentaje ?? 0,
    agenciasDerechoPorcentaje: h.agenciasDerechoPorcentaje ?? h.juezCostasPorcentaje ?? 0,
    juezCostasPorcentaje: h.juezCostasPorcentaje ?? null,
    abogadoFijoCOP: h.abogadoFijoCOP ?? 0,
    agenciasDerechoFijoCOP: h.agenciasDerechoFijoCOP ?? 0,
    juezCostasFijoCOP: h.juezCostasFijoCOP ?? null,
    quienPagaId: h.quienPagaId || null,
    quienPagaNombre: h.quienPagaNombre || null,
    quienRecibeId: h.quienRecibeId || null,
    quienRecibeNombre: h.quienRecibeNombre || null,
    quienesPaganIds: encodeJsonArray(h.quienesPaganIds),
    quienesPaganNombres: encodeJsonArray(h.quienesPaganNombres),
    quienesRecibenIds: encodeJsonArray(h.quienesRecibenIds),
    quienesRecibenNombres: encodeJsonArray(h.quienesRecibenNombres),
    estadoAgencias: h.estadoAgencias ?? null,
  };
}

function procesoScalarData(dto: ProcesoParticion): Prisma.ProcesoUncheckedUpdateInput {
  return {
    nombreCaso: dto.nombreCaso ?? '',
    tipoProceso: dto.tipoProceso ?? '',
    regimenSucesoral: dto.regimenSucesoral ?? null,
    tieneCapitulaciones: dto.tieneCapitulaciones ?? false,
    porcentajeGanancialesCapitulaciones: dto.porcentajeGanancialesCapitulaciones ?? 50,
    calcularGananciaOcasional: dto.calcularGananciaOcasional ?? true,
    tarifaGananciaOcasionalPct: dto.tarifaGananciaOcasionalPct ?? 15,
    fechaCreacion: new Date(dto.fechaCreacion),
    fechaUltimaEdicion: new Date(dto.fechaUltimaEdicion ?? dto.fechaCreacion),
    finalizado: dto.finalizado ?? false,
    pasoActual: dto.pasoActual ?? 1,
  };
}

function procesoToCreateData(dto: ProcesoParticion, abogadoId: string): Prisma.ProcesoCreateInput {
  return {
    id: dto.id,
    nombreCaso: dto.nombreCaso ?? '',
    tipoProceso: dto.tipoProceso ?? '',
    regimenSucesoral: dto.regimenSucesoral ?? null,
    tieneCapitulaciones: dto.tieneCapitulaciones ?? false,
    porcentajeGanancialesCapitulaciones: dto.porcentajeGanancialesCapitulaciones ?? 50,
    calcularGananciaOcasional: dto.calcularGananciaOcasional ?? true,
    tarifaGananciaOcasionalPct: dto.tarifaGananciaOcasionalPct ?? 15,
    fechaCreacion: new Date(dto.fechaCreacion),
    fechaUltimaEdicion: new Date(dto.fechaUltimaEdicion ?? dto.fechaCreacion),
    finalizado: dto.finalizado ?? false,
    pasoActual: dto.pasoActual ?? 1,
    abogado: { connect: { id: abogadoId } },
    bienes: {
      create: (dto.bienes ?? []).map((b) => ({
        id: b.id,
        nombre: b.nombre,
        valor: b.valor ?? 0,
        asignadoAId: b.asignadoAId ?? null,
      })),
    },
    personas: {
      create: (dto.personas ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        tipoRelacion: p.tipoRelacion ?? 'Familiar',
        parentesco: p.parentesco ?? null,
        bienesAsignadosIds: encodeJsonArray(p.bienesAsignadosIds),
        declaradoIndigno: p.declaradoIndigno ?? false,
        desheredado: p.desheredado ?? false,
        porcentajeParticipacion: p.porcentajeParticipacion ?? null,
      })),
    },
    leyes: {
      create: (dto.leyes ?? []).map((l) => ({
        id: l.id,
        nombre: l.nombre,
        porcentaje: l.porcentaje ?? 0,
        aplicaA: l.aplicaA ?? 'Todas',
        activa: l.activa ?? true,
        descripcion: l.descripcion ?? null,
        baseCalculo: l.baseCalculo ?? null,
        leyPadreId: l.leyPadreId ?? null,
      })),
    },
    costo: dto.honorarios ? { create: costoToCreateData(dto.honorarios) } : undefined,
  };
}

export async function obtenerProcesoConRelaciones(id: string): Promise<ProcesoConRelaciones | null> {
  return prisma.proceso.findUnique({
    where: { id },
    include: procesoInclude,
  });
}

/**
 * Crea o reemplaza por completo un proceso (upsert) con sus bienes, personas,
 * leyes y costos asociados. Comportamiento idéntico al "guardar" del frontend.
 */
export async function upsertProceso(dto: ProcesoParticion, abogadoId: string): Promise<ProcesoConRelaciones> {
  const existe = await prisma.proceso.findUnique({ where: { id: dto.id } });

  if (existe) {
    await prisma.$transaction([
      prisma.bien.deleteMany({ where: { procesoId: dto.id } }),
      prisma.persona.deleteMany({ where: { procesoId: dto.id } }),
      prisma.ley.deleteMany({ where: { procesoId: dto.id } }),
      prisma.costoProceso.deleteMany({ where: { procesoId: dto.id } }),
    ]);

    await prisma.proceso.update({
      where: { id: dto.id },
      data: procesoScalarData(dto),
    });

    const bienes = dto.bienes ?? [];
    if (bienes.length > 0) {
      await prisma.bien.createMany({
        data: bienes.map((b) => ({
          id: b.id,
          nombre: b.nombre,
          valor: b.valor ?? 0,
          asignadoAId: b.asignadoAId ?? null,
          procesoId: dto.id,
        })),
      });
    }

    const personas = dto.personas ?? [];
    if (personas.length > 0) {
      await prisma.persona.createMany({
        data: personas.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          tipoRelacion: p.tipoRelacion ?? 'Familiar',
          parentesco: p.parentesco ?? null,
          bienesAsignadosIds: encodeJsonArray(p.bienesAsignadosIds),
          declaradoIndigno: p.declaradoIndigno ?? false,
          desheredado: p.desheredado ?? false,
          porcentajeParticipacion: p.porcentajeParticipacion ?? null,
          procesoId: dto.id,
        })),
      });
    }

    const leyes = dto.leyes ?? [];
    if (leyes.length > 0) {
      await prisma.ley.createMany({
        data: leyes.map((l) => ({
          id: l.id,
          nombre: l.nombre,
          porcentaje: l.porcentaje ?? 0,
          aplicaA: l.aplicaA ?? 'Todas',
          activa: l.activa ?? true,
          descripcion: l.descripcion ?? null,
          baseCalculo: l.baseCalculo ?? null,
          leyPadreId: l.leyPadreId ?? null,
          procesoId: dto.id,
        })),
      });
    }

    if (dto.honorarios) {
      await prisma.costoProceso.create({
        data: { ...costoToCreateData(dto.honorarios), procesoId: dto.id },
      });
    }
  } else {
    await prisma.proceso.create({ data: procesoToCreateData(dto, abogadoId) });
  }

  const registro = await obtenerProcesoConRelaciones(dto.id);
  if (!registro) {
    throw new Error('No se pudo guardar el proceso.');
  }
  return registro;
}

export function casoFinalizadoToDto(row: CasoFinalizadoRow): CasoFinalizado {
  const proceso = decodeJson<ProcesoParticion>(row.proceso);
  const resultado = decodeJson<ResultadoParticion>(row.resultado) ?? undefined;
  return {
    id: row.id,
    procesoId: row.procesoId,
    nombreCaso: row.nombreCaso,
    tipoProceso: row.tipoProceso,
    regimenSucesoral: (row.regimenSucesoral as CasoFinalizado['regimenSucesoral']),
    fechaCreacion: row.fechaCreacion.toISOString(),
    fechaFinalizacion: row.fechaFinalizacion.toISOString(),
    patrimonioTotalCOP: row.patrimonioTotalCOP,
    proceso:
      proceso ??
      ({
        id: row.procesoId,
        nombreCaso: row.nombreCaso,
        tipoProceso: row.tipoProceso,
        regimenSucesoral: (row.regimenSucesoral as CasoFinalizado['regimenSucesoral']),
        fechaCreacion: row.fechaCreacion.toISOString(),
        fechaUltimaEdicion: row.fechaFinalizacion.toISOString(),
        finalizado: true,
        pasoActual: 3,
        bienes: [],
        leyes: [],
        personas: [],
        honorarios: { ...HONORARIOS_POR_DEFECTO },
      } satisfies ProcesoParticion),
    resultado,
  };
}