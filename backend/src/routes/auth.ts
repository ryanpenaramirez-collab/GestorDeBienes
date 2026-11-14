import { Router } from 'express';
import {
  autenticarAbogado,
  crearSesion,
  cerrarSesion,
  abogadoIdPorToken,
  hashCodigoRecuperacion,
  hashPin,
} from '../lib/auth';
import { prisma } from '../lib/prisma';
import { abogadoToPerfil } from '../lib/serializers';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { correo, pin } = (req.body ?? {}) as { correo?: string; pin?: string };
  if (!correo || !pin) {
    res.status(400).json({ error: 'Debe ingresar el correo y el PIN de seguridad.' });
    return;
  }

  const resultado = await autenticarAbogado(correo, pin);

  if (resultado.estado === 'bloqueado') {
    const minutosRestantes = Math.max(
      1,
      Math.ceil((resultado.bloqueadoHasta.getTime() - Date.now()) / 60000),
    );
    res.status(423).json({
      error: `Acceso bloqueado temporalmente por 5 intentos fallidos. Intente de nuevo en ${minutosRestantes} minuto${minutosRestantes === 1 ? '' : 's'}.`,
      bloqueadoHasta: resultado.bloqueadoHasta.toISOString(),
      minutosRestantes,
    });
    return;
  }

  if (resultado.estado === 'credenciales') {
    res.status(401).json({
      error: `Correo electrónico o PIN incorrectos. Intentos restantes: ${resultado.intentosRestantes}.`,
      intentosRestantes: resultado.intentosRestantes,
    });
    return;
  }

  const { abogado } = resultado;
  const codigoRecuperacion = abogado.codigoRecuperacionPendiente ?? undefined;

  if (codigoRecuperacion) {
    await prisma.abogado.update({
      where: { id: abogado.id },
      data: { codigoRecuperacionPendiente: null },
    });
  }

  const token = crearSesion(abogado.id);
  res.json({ token, abogado: abogadoToPerfil(abogado), codigoRecuperacion });
});

authRouter.post('/recuperar', async (req, res) => {
  const { correo, codigo, nuevoPin } = (req.body ?? {}) as {
    correo?: string;
    codigo?: string;
    nuevoPin?: string;
  };

  if (!correo || !codigo) {
    res.status(400).json({ error: 'Debe ingresar el correo y el código de recuperación.' });
    return;
  }

  if (nuevoPin !== undefined && !/^\d{6}$/.test(nuevoPin)) {
    res.status(400).json({ error: 'El nuevo PIN debe tener exactamente 6 dígitos.' });
    return;
  }

  const correoNormalizado = correo.trim().toLowerCase();
  const abogado = await prisma.abogado.findUnique({
    where: { correo: correoNormalizado },
  });

  if (
    !abogado ||
    !abogado.codigoRecuperacionHash ||
    hashCodigoRecuperacion(codigo) !== abogado.codigoRecuperacionHash
  ) {
    res.status(401).json({ error: 'Correo o código de recuperación incorrectos.' });
    return;
  }

  await prisma.abogado.update({
    where: { id: abogado.id },
    data: {
      intentosFallidos: 0,
      bloqueadoHasta: null,
      ...(nuevoPin ? { pinHash: hashPin(nuevoPin) } : {}),
    },
  });

  res.json({
    ok: true,
    mensaje: nuevoPin
      ? 'Acceso recuperado y PIN actualizado correctamente.'
      : 'Acceso desbloqueado correctamente.',
  });
});

authRouter.post('/logout', (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) cerrarSesion(token);
  res.status(200).json({ ok: true });
});

authRouter.get('/sesion', (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const abogadoId = abogadoIdPorToken(token);
  if (!abogadoId) {
    res.status(401).json({ error: 'Sesión no válida.' });
    return;
  }
  res.json({ abogadoId });
});