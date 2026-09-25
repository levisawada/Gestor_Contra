import { randomInt } from 'crypto';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const SYMBOLS   = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const ALL_CHARS  = UPPERCASE + LOWERCASE + SYMBOLS;

/**
 * Genera una contraseña aleatoria criptográficamente segura.
 *
 * Conjunto de caracteres: mayúsculas + minúsculas + símbolos permitidos.
 * Longitud mínima: 6 (por defecto). Longitud máxima: 128.
 *
 * @param length  Número de caracteres. Default: 6.
 */
export function generatePassword(length: number = 6): string {
    return Array.from(
        { length },
        () => ALL_CHARS[randomInt(0, ALL_CHARS.length)]
    ).join('');
}
