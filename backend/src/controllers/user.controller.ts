import { Request, Response } from 'express';

export const createUser = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: [],
    });
};

export const findAllUsers = (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: [],
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
