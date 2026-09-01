import { Request, Response } from 'express';
import {
    GetUserByIdParams,
    LoginUserInput,
    RegisterUserInput,
} from '../schemas';
import { UserService } from '../services/users.services';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken } from '../utils/jwt.utils';

export const createUser = asyncHandler(
    async (req: Request<{}, {}, RegisterUserInput>) => {
        const user = await UserService.register(req.body);

        return {
            data: user,
            message: 'Usuario registrado con éxito',
        };
    }
);

export const findAllUsers = asyncHandler(async (_: Request) => {
    return await UserService.getAll();
});

export const findOneUser = asyncHandler(
    async (req: Request<GetUserByIdParams>) => {
        const user = await UserService.getOne(req.params.id);

        if (!user) {
            return {
                data: null,
                message: 'Usuario no encontrado',
            };
        }

        return {
            data: user,
        };
    }
);

export const updateUser = asyncHandler(
    async (req: Request<GetUserByIdParams>) => {
        const user = await UserService.update(req.params.id, req.body);

        if (!user) {
            return {
                data: null,
                message: 'Usuario no encontrado',
            };
        }

        return {
            data: user,
        };
    }
);

export const deleteUser = asyncHandler(
    async (req: Request<GetUserByIdParams>) => {
        const deleted = await UserService.delete(req.params.id);

        return {
            data: deleted,
        };
    }
);

export const login = asyncHandler(
    async (req: Request<LoginUserInput>, res: Response) => {
        const user = await UserService.login(req.body);

        if (!user) {
            const error = new Error('Correo o contraseña incorrectos');
            (error as any).statusCode = 401;
            throw error;
        }

        const { createdAt, updatedAt, ...payload } = user;

        const token = generateToken(payload);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 1000,
        });

        return {
            statusCode: 200,
            message: 'Inicio de sesión exitoso',
            data: {
                user,
            },
        };
    }
);
