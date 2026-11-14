import { prisma } from './prisma';
import { generarCodigoRecuperacion, hashCodigoRecuperacion, hashPin } from './auth';

// Se asegura de que exista el abogado titular por defecto (upsert idempotente).
// Ejecutado al arrancar el servidor para que el inicio de sesión funcione de inmediato.
export async function asegurarAbogadoPorDefecto(): Promise<void> {
  const perfil = {
    nombreCompleto: 'Dr. Alejandro Restrepo Salazar',
    tarjetaProfesional: '248.910 del C.S.J.',
    documentoIdentidad: 'C.C. 1.020.456.789 de Bogotá D.C.',
    despacho: 'Restrepo & Asociados - Consultores Jurídicos y Patrimoniales',
    paginaWeb: '',
    correo: 'alejandro.restrepo@gestordebienes.legal',
    telefono: '+57 (601) 315-8900',
    ciudad: 'Bogotá D.C., Colombia',
    areaEspecialidad: 'Derecho de Familia, Sucesiones y Liquidación Patrimonial',
  };

  const existente = await prisma.abogado.findUnique({
    where: { correo: perfil.correo },
  });

  const codigoRecuperacion = !existente?.codigoRecuperacionHash
    ? generarCodigoRecuperacion()
    : null;
  const codigoParaCrear = codigoRecuperacion ?? generarCodigoRecuperacion();

  await prisma.abogado.upsert({
    where: { correo: perfil.correo },
    update: {
      ...perfil,
      ...(codigoRecuperacion
        ? {
            codigoRecuperacionHash: hashCodigoRecuperacion(codigoRecuperacion),
            codigoRecuperacionPendiente: codigoRecuperacion,
          }
        : {}),
    },
    create: {
      ...perfil,
      pinHash: hashPin('123456'),
      codigoRecuperacionHash: hashCodigoRecuperacion(codigoParaCrear),
      codigoRecuperacionPendiente: codigoParaCrear,
    },
  });
}