import { Request, Response } from 'express';
import {
    GetUserByIdParams,
    LoginUserInput,
    QuickLoginInput,
    RegisterUserInput,
    UpdateUserInput,
} from '../schemas';
import { UserService } from '../services/users.services';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken } from '../utils/jwt.utils';

// Opciones comunes de cookie (reutilizadas en login, quickLogin y logout)
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 15 * 60 * 1000, // 15 minutos en ms
};

// ---------------------------------------------------------------------------
// CRUD de usuarios
// ---------------------------------------------------------------------------

export const createUser = asyncHandler(
    async (req: Request<{}, {}, RegisterUserInput>) => {
        const user = await UserService.register(req.body);
        return { data: user, message: 'Usuario registrado con éxito' };
    }
);

export const findAllUsers = asyncHandler(async (_: Request) => {
    return await UserService.getAll();
});

export const findOneUser = asyncHandler(
    async (req: Request<GetUserByIdParams>) => {
        if (req.user!.id !== req.params.id) {
            const error = new Error('No tienes permiso para acceder a este perfil');
            (error as any).statusCode = 403;
            throw error;
        }
        const user = await UserService.getOne(req.params.id);
        return { data: user ?? null, message: user ? undefined : 'Usuario no encontrado' };
    }
);

export const updateUser = asyncHandler(
    async (req: Request<GetUserByIdParams, {}, UpdateUserInput>) => {
        if (req.user!.id !== req.params.id) {
            const error = new Error('No tienes permiso para modificar este perfil');
            (error as any).statusCode = 403;
            throw error;
        }
        const user = await UserService.update(req.params.id, req.body);
        return { data: user ?? null, message: user ? undefined : 'Usuario no encontrado' };
    }
);

export const deleteUser = asyncHandler(
    async (req: Request<GetUserByIdParams>) => {
        if (req.user!.id !== req.params.id) {
            const error = new Error('No tienes permiso para eliminar este perfil');
            (error as any).statusCode = 403;
            throw error;
        }
        const deleted = await UserService.delete(req.params.id);
        return { data: deleted };
    }
);

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/users/login
 * Full-login: valida email + contraseña, genera PIN de sesión de 4 dígitos,
 * emite JWT 15 min y devuelve el PIN al cliente (se muestra una sola vez).
 */
export const login = asyncHandler(
    async (req: Request<{}, {}, LoginUserInput>, res: Response) => {
        const result = await UserService.login(req.body);

        if (!result) {
            const error = new Error('Correo o contraseña incorrectos');
            (error as any).statusCode = 401;
            throw error;
        }

        const { user, pin } = result;
        const { createdAt, updatedAt, ...payload } = user;
        const token = generateToken(payload);

        res.cookie('token', token, COOKIE_OPTIONS);

        return {
            statusCode: 200,
            message: 'Inicio de sesión exitoso',
            data: {
                user,
                pin, // PIN de 4 dígitos para quick-login (mostrar al usuario)
            },
        };
    }
);

/**
 * POST /api/v1/users/quick-login
 * Valida userId + PIN de 4 dígitos. Si es correcto, renueva la sesión
 * 15 min más sin necesidad de re-ingresar email ni contraseña.
 */
export const quickLogin = asyncHandler(
    async (req: Request<{}, {}, QuickLoginInput>, res: Response) => {
        const user = await UserService.quickLogin(req.body);

        if (!user) {
            const error = new Error('PIN inválido o expirado. Inicia sesión nuevamente.');
            (error as any).statusCode = 401;
            throw error;
        }

        const { createdAt, updatedAt, ...payload } = user;
        const token = generateToken(payload);

        res.cookie('token', token, COOKIE_OPTIONS);

        return {
            statusCode: 200,
            message: 'Acceso rápido exitoso',
            data: { user },
        };
    }
);

/**
 * POST /api/v1/users/logout
 * Invalida la sesión: borra el PIN de DB y limpia la cookie httpOnly.
 * Requiere autenticación (middleware `authenticate`).
 */
export const logout = asyncHandler(
    async (req: Request, res: Response) => {
        await UserService.logout(req.user!.id);

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return { statusCode: 200, message: 'Sesión cerrada correctamente' };
    }
);
