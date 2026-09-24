import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex');
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

  const abogado = await prisma.abogado.upsert({
    where: { correo: perfil.correo },
    update: perfil,
    create: {
      ...perfil,
      pinHash: hashPin('123456'),
    },
  });

  console.log(
    `Abogado ${abogado.nombreCompleto} listo (correo: ${abogado.correo}, PIN de acceso: 123456)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });