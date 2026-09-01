import { Router } from 'express';
import {
    createUser,
    deleteUser,
    findAllUsers,
    findOneUser,
    login,
    updateUser,
} from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import {
    getUserByIdSchema,
    loginUserSchema,
    registerUserSchema,
} from '../schemas';

const router = Router();

router.post('/register', validate(registerUserSchema), createUser);

router.post('/login', validate(loginUserSchema), login);

router.get('/', findAllUsers);

router.get('/:id', validate(getUserByIdSchema), findOneUser);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

export default router;
