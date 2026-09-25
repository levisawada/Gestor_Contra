import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

/**
 * Middleware de autenticación JWT.
 *
 * Lee el token desde la cookie `token` (httpOnly), lo verifica con
 * `verifyToken` y adjunta el payload decodificado a `req.user`.
 *
 * Compatibilidad Zero-Knowledge: la contraseña maestra viaja por separado
 * en el header `X-Master-Password` (solo en rutas de passwords).
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const token = req.cookies?.token as string | undefined;

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'No autenticado. Inicia sesión para continuar.',
        });
        return;
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (err: any) {
        const isExpired = err.name === 'TokenExpiredError';

        res.status(401).json({
            success: false,
            message: isExpired
                ? 'La sesión ha expirado. Vuelve a iniciar sesión.'
                : 'Token inválido.',
        });
    }
};
