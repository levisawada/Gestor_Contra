import { Router } from 'express';
import {
    createUser,
    deleteUser,
    findAllUsers,
    findOneUser,
    login,
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
router.post('/logout', authenticate, logout);

// CRUD de perfiles (protegidos — solo el propio usuario debería acceder)
router.get('/', findAllUsers);
router.get('/:id', validate(getUserByIdSchema), findOneUser);
router.patch('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', validate(getUserByIdSchema), deleteUser);

export default router;
