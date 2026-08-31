import { Router } from 'express';
import {
    createUser,
    deleteUser,
    findAllUsers,
    findOneUser,
    updateUser,
} from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { getUserByIdSchema, registerUserSchema } from '../schemas';

const router = Router();

router.post('/register', validate(registerUserSchema), createUser);

router.get('/', findAllUsers);

router.get('/:id', validate(getUserByIdSchema), findOneUser);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

export default router;
