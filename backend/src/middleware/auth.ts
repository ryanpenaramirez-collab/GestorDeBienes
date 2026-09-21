import { NextFunction, Request, Response } from 'express';
import { abogadoIdPorToken } from '../lib/auth';

export interface RequestConAbogado extends Request {
  abogadoId?: string;
}

export function authMiddleware(req: RequestConAbogado, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  const abogadoId = abogadoIdPorToken(token);
  if (!abogadoId) {
    res.status(401).json({ error: 'Sesión no iniciada o expirada. Inicie sesión nuevamente.' });
    return;
  }

  req.abogadoId = abogadoId;
  next();
}