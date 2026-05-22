import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'tp7m_jwt_secret_2024';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; rol: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; rol: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function adminRequired(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.rol !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado: se requiere rol ADMIN' });
    return;
  }
  next();
}
