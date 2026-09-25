/**
 * crypto.utils.ts
 *
 * Servicio de cifrado Zero-Knowledge para el Gestor de Contraseñas.
 *
 * Principio de diseño:
 *   - La contraseña maestra del usuario llega al servidor SOLO durante la
 *     operación puntual (header X-Master-Password).
 *   - Se deriva una clave AES-256 vía PBKDF2 en memoria, se usa una vez y
 *     se descarta; jamás se persiste ni en DB ni en logs.
 *   - El servidor no puede descifrar ninguna contraseña sin la contraseña
 *     maestra del usuario (Zero-Knowledge en el lado del servidor).
 *
 * Algoritmos:
 *   - Derivación de clave : PBKDF2-SHA256, 100 000 iteraciones, salt = userId
 *   - Cifrado             : AES-256-GCM, IV de 96 bits aleatorio por registro
 *   - Serialización       : hex (compatible con columnas TEXT de SQLite)
 */

import {
    createCipheriv,
    createDecipheriv,
    pbkdf2 as pbkdf2Callback,
    randomBytes,
} from 'crypto';
import { promisify } from 'util';

// ---------------------------------------------------------------------------
// Constantes del esquema criptográfico
// ---------------------------------------------------------------------------

/** Número de iteraciones PBKDF2 (NIST SP 800-132 recomienda ≥ 10 000; usamos 100 000). */
const PBKDF2_ITERATIONS = 100_000;

/** Longitud de la clave derivada en bytes (32 bytes = 256 bits → AES-256). */
const KEY_LENGTH = 32;

/** Función de hash para PBKDF2. */
const PBKDF2_DIGEST = 'sha256';

/** Longitud del IV para AES-GCM en bytes (12 bytes = 96 bits, recomendado por NIST). */
const GCM_IV_LENGTH = 12;

/** Longitud del tag de autenticación AES-GCM en bytes (máximo seguro: 16). */
const GCM_AUTH_TAG_LENGTH = 16;

/** Algoritmo de cifrado simétrico. */
const CIPHER_ALGORITHM = 'aes-256-gcm';

// ---------------------------------------------------------------------------
// Promisify de pbkdf2 para no bloquear el event loop de Node
// ---------------------------------------------------------------------------

const pbkdf2Async = promisify(pbkdf2Callback);

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

/** Resultado del cifrado; todos los campos se persisten en la tabla `passwords`. */
export interface EncryptedPayload {
    /** Texto cifrado serializado en hex. */
    encryptedPassword: string;
    /** Vector de inicialización AES-GCM serializado en hex (único por registro). */
    iv: string;
    /** Tag de autenticación AES-GCM serializado en hex (garantiza integridad). */
    authTag: string;
}

// ---------------------------------------------------------------------------
// Funciones públicas
// ---------------------------------------------------------------------------

/**
 * Deriva una clave AES-256 a partir de la contraseña maestra del usuario.
 *
 * El salt es el `userId` (UUID v4), que es único por usuario y determinístico:
 * la misma contraseña + el mismo userId siempre producen la misma clave, lo
 * que permite descifrar registros existentes sin almacenar el salt por separado.
 *
 * @param masterPassword  Contraseña maestra del perfil (texto plano, en memoria).
 * @param userId          UUID del usuario (actúa como salt PBKDF2).
 * @returns               Buffer de 32 bytes listo para usarse como clave AES-256.
 *
 * @example
 * const key = await deriveKey('MiContraseñaSecreta', 'uuid-del-usuario');
 */
export async function deriveKey(
    masterPassword: string,
    userId: string
): Promise<Buffer> {
    return pbkdf2Async(
        masterPassword,
        userId,            // salt determinístico y único por usuario
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        PBKDF2_DIGEST
    );
}

/**
 * Cifra un texto plano con AES-256-GCM usando la clave derivada.
 *
 * Genera un IV aleatorio de 96 bits en cada llamada, garantizando que dos
 * cifrados del mismo texto con la misma clave produzcan ciphertexts distintos.
 *
 * @param plainText  Contraseña del sitio en texto plano.
 * @param key        Buffer de 32 bytes devuelto por `deriveKey`.
 * @returns          `EncryptedPayload` con los tres campos a persistir en DB.
 *
 * @throws Si `key` no tiene exactamente 32 bytes.
 *
 * @example
 * const key = await deriveKey(masterPassword, userId);
 * const payload = encrypt('MiContraseñaDeGitHub', key);
 * // Guardar payload.encryptedPassword, payload.iv, payload.authTag en DB
 */
export function encrypt(plainText: string, key: Buffer): EncryptedPayload {
    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `La clave debe tener ${KEY_LENGTH} bytes, recibida: ${key.length}`
        );
    }

    // IV aleatorio de 96 bits por cada cifrado (nunca reutilizar IV con la misma clave)
    const iv = randomBytes(GCM_IV_LENGTH);

    const cipher = createCipheriv(CIPHER_ALGORITHM, key, iv, {
        authTagLength: GCM_AUTH_TAG_LENGTH,
    });

    // Cifrar el texto plano
    const encryptedBuffer = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
    ]);

    // El auth tag se extrae DESPUÉS de llamar a cipher.final()
    const authTag = cipher.getAuthTag();

    return {
        encryptedPassword: encryptedBuffer.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
    };
}

/**
 * Descifra un payload AES-256-GCM y devuelve el texto plano original.
 *
 * Si la clave es incorrecta, el IV está corrupto o el auth tag no coincide,
 * `decipher.final()` lanza un error de autenticación GCM, lo que protege
 * contra manipulación del ciphertext (garantía de integridad).
 *
 * @param payload  Objeto `EncryptedPayload` leído de la DB.
 * @param key      Buffer de 32 bytes devuelto por `deriveKey`.
 * @returns        Texto plano descifrado.
 *
 * @throws Si la contraseña maestra es incorrecta o el ciphertext está corrompido.
 *
 * @example
 * const key = await deriveKey(masterPassword, userId);
 * const plainText = decrypt(payloadFromDb, key);
 */
export function decrypt(payload: EncryptedPayload, key: Buffer): string {
    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `La clave debe tener ${KEY_LENGTH} bytes, recibida: ${key.length}`
        );
    }

    const ivBuffer = Buffer.from(payload.iv, 'hex');
    const authTagBuffer = Buffer.from(payload.authTag, 'hex');
    const encryptedBuffer = Buffer.from(payload.encryptedPassword, 'hex');

    const decipher = createDecipheriv(CIPHER_ALGORITHM, key, ivBuffer, {
        authTagLength: GCM_AUTH_TAG_LENGTH,
    });

    // El auth tag debe establecerse antes de llamar a decipher.final()
    decipher.setAuthTag(authTagBuffer);

    const decryptedBuffer = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(), // ← lanza error si el tag no coincide (integridad GCM)
    ]);

    return decryptedBuffer.toString('utf8');
}
