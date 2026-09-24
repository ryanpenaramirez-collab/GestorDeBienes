import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { abogadoToPerfil } from '../lib/serializers';
import type { PerfilAbogado } from '../types';
import { authMiddleware, RequestConAbogado } from '../middleware/auth';

export const abogadoRouter = Router();

abogadoRouter.use(authMiddleware);

abogadoRouter.get('/:id', async (req: RequestConAbogado, res) => {
  if (req.params.id !== req.abogadoId) {
    res.status(403).json({ error: 'No autorizado para consultar este perfil.' });
    return;
  }
  const abogado = await prisma.abogado.findUnique({ where: { id: req.params.id } });
  if (!abogado) {
    res.status(404).json({ error: 'Abogado no encontrado.' });
    return;
  }
  res.json(abogadoToPerfil(abogado));
});

// Mapeo de los campos del perfil (DTO del frontend) a los campos del esquema nuevo
const MAPEO_CAMPOS: Array<[keyof PerfilAbogado, string]> = [
  ['nombre', 'nombreCompleto'],
  ['tarjetaProfesional', 'tarjetaProfesional'],
  ['documentoIdentidad', 'documentoIdentidad'],
  ['despachoFirma', 'despacho'],
  ['sitioWeb', 'paginaWeb'],
  ['correo', 'correo'],
  ['telefono', 'telefono'],
  ['ciudad', 'ciudad'],
  ['especialidad', 'areaEspecialidad'],
  ['fotoPerfil', 'fotoPerfilUrl'],
  ['leyendaNotarial', '__ignorado__'],
  ['registrado', '__ignorado__'],
];

abogadoRouter.patch('/:id', async (req: RequestConAbogado, res) => {
  if (req.params.id !== req.abogadoId) {
    res.status(403).json({ error: 'No autorizado para modificar este perfil.' });
    return;
  }

  const body = (req.body ?? {}) as Partial<PerfilAbogado>;
  const data: Record<string, unknown> = {};

  for (const [dtoCampo, dbCampo] of MAPEO_CAMPOS) {
    if (dbCampo === '__ignorado__') continue;
    if (body[dtoCampo] !== undefined) data[dbCampo] = body[dtoCampo];
  }

  if (data.correo !== undefined) {
    data.correo = String(data.correo).trim().toLowerCase();
    const duplicado = await prisma.abogado.findFirst({
      where: { correo: data.correo as string, NOT: { id: req.params.id } },
      select: { id: true },
    });
    if (duplicado) {
      res.status(409).json({ error: 'Ya existe un abogado registrado con ese correo.' });
      return;
    }
  }

  if (data.paginaWeb === '') data.paginaWeb = null;

  const abogado = await prisma.abogado.update({
    where: { id: req.params.id },
    data,
  });

  res.json(abogadoToPerfil(abogado));
});