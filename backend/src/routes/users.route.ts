import { Router } from 'express';
import {
    createUser,
    deleteUser,
    findAllUsers,
    findOneUser,
    hasActiveSession,
    login,
    lockSession,
    logout,
    quickLogin,
    updateUser,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    getUserByIdSchema,
    loginUserSchema,
    quickLoginSchema,
    registerUserSchema,
    updateUserSchema,
} from '../schemas';

const router = Router();

// Autenticación
router.post('/register', validate(registerUserSchema), createUser);
router.post('/login', validate(loginUserSchema), login);
router.post('/quick-login', validate(quickLoginSchema), quickLogin);
router.post('/lock', lockSession);
router.post('/logout', authenticate, logout);

// CRUD de perfiles
router.get('/', findAllUsers); // PÚBLICO (para pantalla principal)

// PÚBLICO — el frontend lo usa para decidir qué formulario mostrar
router.get('/:id/has-session', validate(getUserByIdSchema), hasActiveSession);

// PROTEGIDOS (req.user debe coincidir con :id)
router.get('/:id', authenticate, validate(getUserByIdSchema), findOneUser);
router.patch('/:id', authenticate, validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, validate(getUserByIdSchema), deleteUser);

export default router;
