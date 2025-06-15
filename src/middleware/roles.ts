import { Response, NextFunction } from 'express';
import { AuthRequest } from '../index';

export const esVendedor = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol === 'VENDEDOR') {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Solo vendedores.' });
};

export const esComprador = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol === 'COMPRADOR') {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Solo compradores.' });
};
