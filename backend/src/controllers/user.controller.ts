import { Request, Response } from 'express';
import { GetUserByIdParams, RegisterUserInput } from '../schemas';
import { UserService } from '../services/users.services';
import { asyncHandler } from '../utils/asyncHandler';

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
    const users = await UserService.getAll();

    return {
        data: users,
    };
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
