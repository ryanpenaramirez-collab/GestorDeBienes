import { createHash, randomUUID } from 'node:crypto';
import { prisma } from './prisma';

export function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

// Sesiones en memoria: token -> id del abogado
const sesionesPorToken = new Map<string, string>();

export function crearSesion(abogadoId: string): string {
  const token = randomUUID();
  sesionesPorToken.set(token, abogadoId);
  return token;
}

export function cerrarSesion(token: string): void {
  sesionesPorToken.delete(token);
}

export function abogadoIdPorToken(token: string | undefined | null): string | null {
  if (!token) return null;
  return sesionesPorToken.get(token) ?? null;
}

export async function autenticarAbogado(correo: string, pin: string) {
  const correoNormalizado = (correo || '').trim().toLowerCase();
  if (!correoNormalizado || !pin) return null;

  const abogado = await prisma.abogado.findUnique({
    where: { correo: correoNormalizado },
  });
  if (!abogado) return null;
  if (hashPin(pin.trim()) !== abogado.pin) return null;

  return abogado;
}