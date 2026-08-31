import { Request, Response } from 'express';
import { RegisterUserInput } from '../schemas';
import { UserService } from '../services/users.services';

export const createUser = async (
    req: Request<{}, {}, RegisterUserInput>,
    res: Response
) => {
    const user = await UserService.register(req.body);
    res.json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user,
    });
};

export const findAllUsers = async (req: Request, res: Response) => {
    const users = await UserService.getAll();

    res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: users,
    });
};

export const findOneUser = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: [],
    });
};

export const updateUser = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: [],
    });
};

export const deleteUser = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: [],
    });
};
