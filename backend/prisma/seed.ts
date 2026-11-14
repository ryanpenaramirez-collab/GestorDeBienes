import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
}

function hashCodigo(codigo: string): string {
  return createHash('sha256').update(codigo.trim().toUpperCase()).digest('hex');
}

function generarCodigoRecuperacion(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(15);
  const caracteres = Array.from(bytes, (byte) => alfabeto[byte % alfabeto.length]);
  return [
    caracteres.slice(0, 5).join(''),
    caracteres.slice(5, 10).join(''),
    caracteres.slice(10, 15).join(''),
  ].join('-');
}

async function main() {
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

  const abogado = await prisma.abogado.upsert({
    where: { correo: perfil.correo },
    update: {
      ...perfil,
      ...(codigoRecuperacion
        ? {
            codigoRecuperacionHash: hashCodigo(codigoRecuperacion),
            codigoRecuperacionPendiente: codigoRecuperacion,
          }
        : {}),
    },
    create: {
      ...perfil,
      pinHash: hashPin('123456'),
      codigoRecuperacionHash: hashCodigo(codigoParaCrear),
      codigoRecuperacionPendiente: codigoParaCrear,
    },
  });

  console.log(
    `Abogado ${abogado.nombreCompleto} listo (correo: ${abogado.correo}, PIN de acceso: 123456)`
  );
  if (codigoRecuperacion) {
    console.log(
      `Código de recuperación (se mostrará una sola vez en la app): ${codigoRecuperacion}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });