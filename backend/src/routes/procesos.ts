import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { calcularParticion } from '../utils/calculator';
import type { ProcesoParticion, ResultadoParticion, CasoFinalizado } from '../types';
import {
  procesoInclude,
  procesoToDto,
  upsertProceso,
  obtenerProcesoConRelaciones,
  casoFinalizadoToDto,
} from '../lib/serializers';
import { authMiddleware, RequestConAbogado } from '../middleware/auth';

export const procesosRouter = Router();

procesosRouter.use(authMiddleware);

procesosRouter.get('/', async (req: RequestConAbogado, res) => {
  const items = await prisma.proceso.findMany({
    where: { abogadoId: req.abogadoId, finalizado: false },
    include: procesoInclude,
    orderBy: { fechaUltimaEdicion: 'desc' },
  });
  res.json(items.map(procesoToDto));
});

// Historial de casos finalizados (se declara antes de rutas con :id)
procesosRouter.get('/finalizados', async (req: RequestConAbogado, res) => {
  const casos = await prisma.casoFinalizado.findMany({
    where: { abogadoId: req.abogadoId },
    orderBy: { fechaFinalizacion: 'desc' },
  });
  res.json(casos.map(casoFinalizadoToDto));
});

procesosRouter.delete('/casos-finalizados/:id', async (req: RequestConAbogado, res) => {
  await prisma.casoFinalizado.deleteMany({
    where: { id: req.params.id, abogadoId: req.abogadoId },
  });
  res.status(200).json({ ok: true });
});

procesosRouter.delete('/casos-finalizados', async (req: RequestConAbogado, res) => {
  await prisma.casoFinalizado.deleteMany({ where: { abogadoId: req.abogadoId } });
  res.status(200).json({ ok: true });
});

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

// Crear o actualizar proceso (upsert)
procesosRouter.post('/', async (req: RequestConAbogado, res) => {
  const dto = req.body as ProcesoParticion;
  if (!dto || !dto.id) {
    res.status(400).json({ error: 'Proceso inválido: falta el identificador.' });
    return;
  }
  const registro = await upsertProceso(dto, req.abogadoId!);
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
  const registro = await upsertProceso(conId, req.abogadoId!);
  res.json(procesoToDto(registro));
});

// Eliminar borrador de proceso
procesosRouter.delete('/:id', async (req: RequestConAbogado, res) => {
  const proceso = await prisma.proceso.findFirst({
    where: { id: req.params.id, abogadoId: req.abogadoId },
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
  if (!proceso || proceso.abogadoId !== req.abogadoId || proceso.finalizado) {
    res.status(404).json({ error: 'Proceso no encontrado.' });
    return;
  }
  const dto = procesoToDto(proceso);
  res.json({ proceso: dto, resultado: calcularResultadoDelProceso(dto) });
});

// Marcar proceso como finalizado: calcula el resultado, lo guarda en el historial
// y lo saca de la lista de pendientes.
procesosRouter.post('/:id/finalizar', async (req: RequestConAbogado, res) => {
  const proceso = await obtenerProcesoConRelaciones(req.params.id);
  if (!proceso || proceso.abogadoId !== req.abogadoId) {
    res.status(404).json({ error: 'Proceso no encontrado.' });
    return;
  }

  const ahora = new Date();
  const dtoFinalizado: ProcesoParticion = { ...procesoToDto(proceso), finalizado: true };
  const resultado = calcularResultadoDelProceso(dtoFinalizado);
  const patrimonioTotalCOP = dtoFinalizado.bienes.reduce((acc, b) => acc + (Number(b.valor) || 0), 0);

  const casoId = `caso-fin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  await prisma.proceso.update({
    where: { id: dtoFinalizado.id },
    data: { finalizado: true, fechaUltimaEdicion: ahora },
  });

  await prisma.$transaction([
    prisma.casoFinalizado.deleteMany({ where: { procesoId: dtoFinalizado.id } }),
    prisma.casoFinalizado.create({
      data: {
        id: casoId,
        procesoId: dtoFinalizado.id,
        nombreCaso: dtoFinalizado.nombreCaso || 'Expediente Sin Nombre',
        tipoProceso: dtoFinalizado.tipoProceso || 'Partición de Bienes',
        regimenSucesoral: dtoFinalizado.regimenSucesoral ?? null,
        fechaCreacion: new Date(dtoFinalizado.fechaCreacion),
        fechaFinalizacion: ahora,
        patrimonioTotalCOP,
        proceso: JSON.stringify(dtoFinalizado),
        resultado: JSON.stringify(resultado),
        abogadoId: req.abogadoId!,
      },
    }),
  ]);

  const caso: CasoFinalizado = {
    id: casoId,
    procesoId: dtoFinalizado.id,
    nombreCaso: dtoFinalizado.nombreCaso || 'Expediente Sin Nombre',
    tipoProceso: dtoFinalizado.tipoProceso || 'Partición de Bienes',
    regimenSucesoral: dtoFinalizado.regimenSucesoral,
    fechaCreacion: dtoFinalizado.fechaCreacion,
    fechaFinalizacion: ahora.toISOString(),
    patrimonioTotalCOP,
    proceso: dtoFinalizado,
    resultado,
  };

  res.status(201).json({ caso, resultado });
});