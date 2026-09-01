import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
    id: string;
    email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
    '24h') as SignOptions['expiresIn'];

export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        //expiresIn: JWT_EXPIRES_IN,
        expiresIn: '1m',
    });
};
