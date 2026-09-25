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

/**
 * Extrae y valida el header `X-Master-Password`.
 * Adjunta el valor a `req.masterPassword` para uso en controladores.
 * Debe usarse DESPUÉS de `authenticate`.
 */
export const requireMasterPassword = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const masterPassword = req.headers['x-master-password'];

    if (!masterPassword || typeof masterPassword !== 'string' || masterPassword.trim() === '') {
        res.status(400).json({
            success: false,
            message: 'El header X-Master-Password es requerido para esta operación.',
        });
        return;
    }

    req.masterPassword = masterPassword.trim();
    next();
};
