import { Router } from 'express';
import { autenticarAbogado, crearSesion, cerrarSesion, abogadoIdPorToken } from '../lib/auth';
import { abogadoToPerfil } from '../lib/serializers';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { correo, pin } = (req.body ?? {}) as { correo?: string; pin?: string };
  if (!correo || !pin) {
    res.status(400).json({ error: 'Debe ingresar el correo y el PIN de seguridad.' });
    return;
  }

  const abogado = await autenticarAbogado(correo, pin);
  if (!abogado) {
    res.status(401).json({ error: 'Correo electrónico o PIN incorrectos.' });
    return;
  }

  const token = crearSesion(abogado.id);
  res.json({ token, abogado: abogadoToPerfil(abogado) });
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