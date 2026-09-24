import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { procesosRouter } from './routes/procesos';
import { abogadoRouter } from './routes/abogado';
import { asegurarAbogadoPorDefecto } from './lib/bootstrap';

// Orígenes permitidos para CORS, configurables mediante CORS_ORIGINS
// (separados por coma). Por defecto permite el frontend en desarrollo (puerto 3000).
const corsOrigenes = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

async function main() {
  await asegurarAbogadoPorDefecto();

  const app = express();
  app.use(
    cors({
      origin: (origin, callback) => {
        // Sin origen (curl, peticiones del mismo servidor) o listado: permitir
        if (!origin || corsOrigenes.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, servicio: 'Gestor de Bienes - Backend', hora: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/procesos', procesosRouter);
  app.use('/api/abogado', abogadoRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    console.log(`Backend Gestor de Bienes escuchando en http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error('No se pudo iniciar el servidor:', e);
  process.exit(1);
});