import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { calcularParticion } from '../utils/calculator';
import type { CasoFinalizado, ProcesoParticion, ResultadoParticion } from '../types';
import {
  procesoInclude,
  procesoToDto,
  upsertProceso,
  obtenerProcesoConRelaciones,
  type ProcesoConRelaciones,
} from '../lib/serializers';
import { authMiddleware, RequestConAbogado } from '../middleware/auth';

export const procesosRouter = Router();

procesosRouter.use(authMiddleware);

function calcularResultadoDelProceso(dto: ProcesoParticion): ResultadoParticion {
  return calcularParticion(
    dto.personas,
    dto.bienes,
    dto.leyes,
    dto.honorarios,
    {
      tipoProceso: dto.tipoProceso,
      regimenSucesoral: dto.regimenSucesoral,
      tieneCapitulaciones: dto.tieneCapitulaciones,
      porcentajeGanancialesCapitulaciones: dto.porcentajeGanancialesCapitulaciones,
      calcularGananciaOcasional: dto.calcularGananciaOcasional,
      tarifaGananciaOcasionalPct: dto.tarifaGananciaOcasionalPct,
    }
  );
}

function procesoAFinalizadoDto(p: ProcesoConRelaciones): CasoFinalizado {
  const dto = procesoToDto(p);
  const resultado = calcularResultadoDelProceso(dto);
  return {
    id: p.id,
    procesoId: p.id,
    nombreCaso: dto.nombreCaso || 'Expediente Sin Nombre',
    tipoProceso: dto.tipoProceso || 'Partición de Bienes',
    regimenSucesoral: dto.regimenSucesoral,
    fechaCreacion: dto.fechaCreacion,
    fechaFinalizacion: (p.fechaFinalizacion ?? p.fechaActualizacion).toISOString(),
    patrimonioTotalCOP: p.patrimonioBruto,
    proceso: dto,
    resultado,
  };
}

procesosRouter.get('/', async (req: RequestConAbogado, res) => {
  const items = await prisma.proceso.findMany({
    where: { estado: 'PENDIENTE' },
    include: procesoInclude,
    orderBy: { fechaActualizacion: 'desc' },
  });
  res.json(items.map(procesoToDto));
});

// Historial de casos finalizados (se declara antes de rutas con :id)
procesosRouter.get('/finalizados', async (req: RequestConAbogado, res) => {
  const casos = await prisma.proceso.findMany({
    where: { estado: 'FINALIZADO' },
    include: procesoInclude,
    orderBy: { fechaActualizacion: 'desc' },
  });
  res.json(casos.map(procesoAFinalizadoDto));
});

procesosRouter.delete('/casos-finalizados/:id', async (req: RequestConAbogado, res) => {
  await prisma.proceso.deleteMany({
    where: { id: req.params.id, estado: 'FINALIZADO' },
  });
  res.status(200).json({ ok: true });
});

procesosRouter.delete('/casos-finalizados', async (req: RequestConAbogado, res) => {
  await prisma.proceso.deleteMany({ where: { estado: 'FINALIZADO' } });
  res.status(200).json({ ok: true });
});

// Crear o actualizar proceso (upsert)
procesosRouter.post('/', async (req: RequestConAbogado, res) => {
  const dto = req.body as ProcesoParticion;
  if (!dto || !dto.id) {
    res.status(400).json({ error: 'Proceso inválido: falta el identificador.' });
    return;
  }
  const registro = await upsertProceso(dto);
  res.status(201).json(procesoToDto(registro));
});

// Actualizar proceso existente (upsert)
procesosRouter.put('/:id', async (req: RequestConAbogado, res) => {
  const dto = req.body as ProcesoParticion;
  if (!dto) {
    res.status(400).json({ error: 'Proceso inválido.' });
    return;
  }
  const conId = { ...dto, id: req.params.id };
  const registro = await upsertProceso(conId);
  res.json(procesoToDto(registro));
});

// Eliminar borrador de proceso
procesosRouter.delete('/:id', async (req: RequestConAbogado, res) => {
  const proceso = await prisma.proceso.findFirst({
    where: { id: req.params.id, estado: 'PENDIENTE' },
    select: { id: true },
  });
  if (!proceso) {
    res.status(404).json({ error: 'Proceso no encontrado.' });
    return;
  }
  await prisma.proceso.delete({ where: { id: proceso.id } });
  res.status(200).json({ ok: true });
});

// Generar el resultado final del cálculo de reparto de un proceso
procesosRouter.get('/:id/resultado', async (req: RequestConAbogado, res) => {
  const proceso = await obtenerProcesoConRelaciones(req.params.id);
  if (!proceso || proceso.estado === 'FINALIZADO') {
    res.status(404).json({ error: 'Proceso no encontrado.' });
    return;
  }
  const dto = procesoToDto(proceso);
  res.json({ proceso: dto, resultado: calcularResultadoDelProceso(dto) });
});

// Marcar proceso como finalizado: calcula el resultado, guarda el snapshot por
// persona (ResultadoPersona) y lo saca de la lista de pendientes.
procesosRouter.post('/:id/finalizar', async (req: RequestConAbogado, res) => {
  const proceso = await obtenerProcesoConRelaciones(req.params.id);
  if (!proceso) {
    res.status(404).json({ error: 'Proceso no encontrado.' });
    return;
  }

  const ahora = new Date();
  const dtoFinalizado: ProcesoParticion = { ...procesoToDto(proceso), finalizado: true };
  const resultado = calcularResultadoDelProceso(dtoFinalizado);

  await prisma.proceso.update({
    where: { id: dtoFinalizado.id },
    data: { estado: 'FINALIZADO', fechaFinalizacion: ahora },
  });

  // Snapshot del resultado en la tabla ResultadoPersona
  await prisma.resultadoPersona.deleteMany({ where: { procesoId: dtoFinalizado.id } });
  if (resultado.desglosePersonas.length > 0) {
    await prisma.resultadoPersona.createMany({
      data: resultado.desglosePersonas.map((r) => ({
        procesoId: dtoFinalizado.id,
        personaId: r.persona.id,
        montoAsignado: r.totalFinalConAgenciasCOP ?? r.totalAsignadoCOP ?? 0,
        reglaAplicada:
          r.leyesAplicadas.length > 0
            ? r.leyesAplicadas.map((l) => l.leyNombre).join(', ')
            : 'Reparto',
      })),
    });
  }

  const actualizado = await obtenerProcesoConRelaciones(dtoFinalizado.id);
  const caso: CasoFinalizado = actualizado
    ? {
        ...procesoAFinalizadoDto(actualizado),
        fechaFinalizacion: ahora.toISOString(),
      }
    : {
        id: dtoFinalizado.id,
        procesoId: dtoFinalizado.id,
        nombreCaso: dtoFinalizado.nombreCaso || 'Expediente Sin Nombre',
        tipoProceso: dtoFinalizado.tipoProceso || 'Partición de Bienes',
        regimenSucesoral: dtoFinalizado.regimenSucesoral,
        fechaCreacion: dtoFinalizado.fechaCreacion,
        fechaFinalizacion: ahora.toISOString(),
        patrimonioTotalCOP: dtoFinalizado.bienes.reduce(
          (acc, b) => acc + (Number(b.valor) || 0),
          0
        ),
        proceso: dtoFinalizado,
        resultado,
      };

  res.status(201).json({ caso, resultado });
});