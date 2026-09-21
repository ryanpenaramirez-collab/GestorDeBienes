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

abogadoRouter.patch('/:id', async (req: RequestConAbogado, res) => {
  if (req.params.id !== req.abogadoId) {
    res.status(403).json({ error: 'No autorizado para modificar este perfil.' });
    return;
  }

  const body = (req.body ?? {}) as Partial<PerfilAbogado>;
  const data: Record<string, unknown> = {};

  const campos: Array<keyof PerfilAbogado> = [
    'nombre',
    'tarjetaProfesional',
    'documentoIdentidad',
    'despachoFirma',
    'sitioWeb',
    'correo',
    'telefono',
    'ciudad',
    'especialidad',
    'leyendaNotarial',
    'fotoPerfil',
    'registrado',
  ];

  for (const campo of campos) {
    if (body[campo] !== undefined) {
      data[campo] = body[campo];
    }
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

  if (data.sitioWeb === '') data.sitioWeb = null;

  const abogado = await prisma.abogado.update({
    where: { id: req.params.id },
    data,
  });

  res.json(abogadoToPerfil(abogado));
});