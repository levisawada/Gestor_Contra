import { Router } from 'express';
import {
    getAllPasswords,
    getOnePassword,
    createPassword,
    updatePassword,
    deletePassword,
    generatePasswordCtrl,
} from '../controllers/passwords.controller';
import {
    authenticate,
    requireMasterPassword,
} from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createPasswordEntryBodySchema,
    updatePasswordEntryBodySchema,
    passwordEntryIdSchema,
    generatePasswordSchema,
} from '../schemas';

const router = Router();

// Generador de contraseñas (sin auth)
router.get('/generate', validate(generatePasswordSchema), generatePasswordCtrl);

// Lista completa y borrado (requiere sesión, NO requiere master password)
router.get('/', authenticate, getAllPasswords);
router.delete(
    '/:id',
    authenticate,
    validate(passwordEntryIdSchema),
    deletePassword
);

// Operaciones cifradas (requiere sesión + master password via header)
router.get(
    '/:id',
    authenticate,
    requireMasterPassword,
    validate(passwordEntryIdSchema),
    getOnePassword
);
router.post(
    '/',
    authenticate,
    requireMasterPassword,
    validate(createPasswordEntryBodySchema),
    createPassword
);
router.patch(
    '/:id',
    authenticate,
    requireMasterPassword,
    validate(updatePasswordEntryBodySchema),
    updatePassword
);

export default router;
