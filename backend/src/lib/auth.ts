import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Abogado } from '@prisma/client';
import { prisma } from './prisma';

export const MAX_INTENTOS_PIN = 5;
export const DURACION_BLOQUEO_MS = 5 * 60 * 1000;

export function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

export function hashCodigoRecuperacion(codigo: string): string {
  return createHash('sha256').update(codigo.trim().toUpperCase()).digest('hex');
}

export function generarCodigoRecuperacion(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(15);
  const caracteres = Array.from(bytes, (byte) => alfabeto[byte % alfabeto.length]);
  return [
    caracteres.slice(0, 5).join(''),
    caracteres.slice(5, 10).join(''),
    caracteres.slice(10, 15).join(''),
  ].join('-');
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

export type ResultadoAutenticacion =
  | { estado: 'ok'; abogado: Abogado }
  | { estado: 'credenciales'; intentosRestantes: number }
  | { estado: 'bloqueado'; bloqueadoHasta: Date };

export async function autenticarAbogado(
  correo: string,
  pin: string,
): Promise<ResultadoAutenticacion> {
  const correoNormalizado = (correo || '').trim().toLowerCase();
  if (!correoNormalizado || !pin) {
    return { estado: 'credenciales', intentosRestantes: MAX_INTENTOS_PIN };
  }

  const abogado = await prisma.abogado.findUnique({
    where: { correo: correoNormalizado },
  });
  if (!abogado) return { estado: 'credenciales', intentosRestantes: MAX_INTENTOS_PIN };

  const ahora = new Date();

  if (abogado.bloqueadoHasta && abogado.bloqueadoHasta.getTime() > ahora.getTime()) {
    return { estado: 'bloqueado', bloqueadoHasta: abogado.bloqueadoHasta };
  }

  const intentosPrevios =
    abogado.bloqueadoHasta && abogado.bloqueadoHasta.getTime() <= ahora.getTime()
      ? 0
      : abogado.intentosFallidos;

  if (hashPin(pin.trim()) !== abogado.pinHash) {
    const intentos = intentosPrevios + 1;

    if (intentos >= MAX_INTENTOS_PIN) {
      const bloqueadoHasta = new Date(ahora.getTime() + DURACION_BLOQUEO_MS);
      await prisma.abogado.update({
        where: { id: abogado.id },
        data: { intentosFallidos: 0, bloqueadoHasta },
      });
      return { estado: 'bloqueado', bloqueadoHasta };
    }

    await prisma.abogado.update({
      where: { id: abogado.id },
      data: { intentosFallidos: intentos, bloqueadoHasta: null },
    });
    return { estado: 'credenciales', intentosRestantes: MAX_INTENTOS_PIN - intentos };
  }

  const abogadoActualizado = await prisma.abogado.update({
    where: { id: abogado.id },
    data: { intentosFallidos: 0, bloqueadoHasta: null },
  });

  return { estado: 'ok', abogado: abogadoActualizado };
}