import { PerfilAbogado } from '../types';

// URL base del backend, configurable mediante la variable de entorno VITE_API_URL
// (ver frontend/.env.example). Si no está definida, se usa el backend local en el puerto 4000.
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
).replace(/\/+$/, '');

export interface RespuestaLogueo {
  token: string;
  abogado: PerfilAbogado;
  codigoRecuperacion?: string;
}

interface CuerpoError {
  error?: string;
}

async function leerMensajeError(respuesta: Response, mensajePorDefecto: string): Promise<string> {
  try {
    const cuerpo = (await respuesta.json()) as CuerpoError;
    if (cuerpo?.error) return cuerpo.error;
  } catch {
    // Mantener el mensaje por defecto si la respuesta no trae JSON
  }
  return mensajePorDefecto;
}

export async function iniciarSesionEnBackend(correo: string, pin: string): Promise<RespuestaLogueo> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, pin }),
    });
  } catch {
    throw new Error('No se pudo contactar el servidor. Verifique que el backend esté en ejecución.');
  }

  if (!respuesta.ok) {
    throw new Error(
      await leerMensajeError(respuesta, 'Correo o PIN incorrectos.'),
    );
  }

  return (await respuesta.json()) as RespuestaLogueo;
}

export async function recuperarAccesoEnBackend(
  correo: string,
  codigo: string,
  nuevoPin?: string,
): Promise<{ mensaje: string }> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/auth/recuperar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, codigo, nuevoPin: nuevoPin || undefined }),
    });
  } catch {
    throw new Error('No se pudo contactar el servidor. Verifique que el backend esté en ejecución.');
  }

  if (!respuesta.ok) {
    throw new Error(
      await leerMensajeError(respuesta, 'No se pudo recuperar el acceso.'),
    );
  }

  return (await respuesta.json()) as { mensaje: string };
}