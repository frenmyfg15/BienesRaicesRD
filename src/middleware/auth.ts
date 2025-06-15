import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_default';

interface JwtPayloadExtended extends JwtPayload {
  id: number;
  rol: string;
}

interface AuthRequest extends Request {
  user?: JwtPayloadExtended;
}

export const validarToken = (token: string): JwtPayloadExtended | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadExtended;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Token inválido');
    } else {
      console.error('Error verificando token:', error.message);
    }
    return null;
  }
};

export const verificarToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Token no proporcionado' });
    return
  }

  const usuario = validarToken(token);

  if (!usuario) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return
  }

  req.user = usuario;
  next();
};
