import { TokenPayload } from '../../utils/jwt.utils';

/**
 * Extiende el tipo Request de Express para incluir el payload del JWT
 * una vez que el middleware `authenticate` lo ha verificado y adjuntado.
 */
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload; // { id: string; email: string }
            masterPassword?: string; // Header X-Master-Password validado
        }
    }
}
