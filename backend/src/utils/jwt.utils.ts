import jwt, { SignOptions } from 'jsonwebtoken';
import { randomInt } from 'crypto';

export interface TokenPayload {
    id: string;
    email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
    '15m') as SignOptions['expiresIn'];

/** Firma y devuelve un JWT con el payload dado. */
export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
};

/**
 * Verifica y decodifica un JWT.
 * @throws {JsonWebTokenError} Si el token es inválido.
 * @throws {TokenExpiredError} Si el token ha expirado.
 */
export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/** Genera un PIN numérico de 4 dígitos con aleatoriedad criptográfica (0000–9999). */
export const generateSessionPin = (): string => {
    return randomInt(0, 10000).toString().padStart(4, '0');
};

/** Retorna el timestamp ISO correspondiente a ahora + 15 minutos (TTL del PIN). */
export const getPinExpiresAt = (): string => {
    return new Date(Date.now() + 15 * 60 * 1000).toISOString();
};
