import { prisma } from './prisma';
import { hashPin } from './auth';

// Se asegura de que exista el abogado titular por defecto (upsert idempotente).
// Ejecutado al arrancar el servidor para que el inicio de sesión funcione de inmediato.
export async function asegurarAbogadoPorDefecto(): Promise<void> {
  const perfil = {
    nombre: 'Dr. Alejandro Restrepo Salazar',
    tarjetaProfesional: '248.910 del C.S.J.',
    documentoIdentidad: 'C.C. 1.020.456.789 de Bogotá D.C.',
    despachoFirma: 'Restrepo & Asociados - Consultores Jurídicos y Patrimoniales',
    sitioWeb: '',
    correo: 'alejandro.restrepo@gestordebienes.legal',
    telefono: '+57 (601) 315-8900',
    ciudad: 'Bogotá D.C., Colombia',
    especialidad: 'Derecho de Familia, Sucesiones y Liquidación Patrimonial',
    leyendaNotarial: 'Liquidación patrimonial elaborada bajo las disposiciones del C.C. y C.G.P.',
    registrado: true,
  };

  await prisma.abogado.upsert({
    where: { correo: perfil.correo },
    update: {
      nombre: perfil.nombre,
      tarjetaProfesional: perfil.tarjetaProfesional,
      documentoIdentidad: perfil.documentoIdentidad,
      despachoFirma: perfil.despachoFirma,
      sitioWeb: perfil.sitioWeb,
      telefono: perfil.telefono,
      ciudad: perfil.ciudad,
      especialidad: perfil.especialidad,
      leyendaNotarial: perfil.leyendaNotarial,
      registrado: perfil.registrado,
    },
    create: {
      ...perfil,
      pin: hashPin('123456'),
    },
  });
}