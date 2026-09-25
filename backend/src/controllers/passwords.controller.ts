import { Request } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { PasswordService } from '../services/passwords.service';
import { generatePassword } from '../utils/passwordGenerator';
import { 
    CreatePasswordEntryInput, 
    UpdatePasswordEntryInput, 
    PasswordEntryIdParams, 
    GeneratePasswordQuery 
} from '../schemas';

// GET /api/v1/passwords
export const getAllPasswords = asyncHandler(async (req: Request) => {
    const userId = req.user!.id;
    const data = await PasswordService.getAll(userId);
    return { data };
});

// GET /api/v1/passwords/:id
export const getOnePassword = asyncHandler(async (req: Request<PasswordEntryIdParams>) => {
    const userId = req.user!.id;
    const masterPassword = req.masterPassword!; // Garantizado por requireMasterPassword

    try {
        const data = await PasswordService.getOne(userId, req.params.id, masterPassword);
        if (!data) return { statusCode: 404, message: 'Contraseña no encontrada' };
        
        return { data };
    } catch (error: any) {
        // Detectar fallo en tag de autenticación (clave incorrecta o data corrupta)
        if (error.message.includes('authenticate data') || error.message.includes('Unsupported state')) {
            const err = new Error('Contraseña maestra incorrecta');
            (err as any).statusCode = 401;
            throw err;
        }
        throw error; // Otros errores los maneja el globalErrorHandler
    }
});

// POST /api/v1/passwords
export const createPassword = asyncHandler(async (req: Request<{}, {}, CreatePasswordEntryInput>) => {
    const userId = req.user!.id;
    const masterPassword = req.masterPassword!;
    
    const data = await PasswordService.create(userId, req.body, masterPassword);
    
    return { 
        statusCode: 201, 
        data, 
        message: 'Contraseña guardada con éxito' 
    };
});

// PATCH /api/v1/passwords/:id
export const updatePassword = asyncHandler(async (req: Request<PasswordEntryIdParams, {}, UpdatePasswordEntryInput>) => {
    const userId = req.user!.id;
    const masterPassword = req.masterPassword!;
    
    const data = await PasswordService.update(userId, req.params.id, req.body, masterPassword);
    
    if (!data) return { statusCode: 404, message: 'Contraseña no encontrada' };
    
    return { data, message: 'Contraseña actualizada con éxito' };
});

// DELETE /api/v1/passwords/:id
export const deletePassword = asyncHandler(async (req: Request<PasswordEntryIdParams>) => {
    const userId = req.user!.id;
    
    const deleted = await PasswordService.delete(userId, req.params.id);
    if (!deleted) return { statusCode: 404, message: 'Contraseña no encontrada' };
    
    return { data: true, message: 'Contraseña eliminada con éxito' };
});

// GET /api/v1/passwords/generate?length=12
export const generatePasswordCtrl = asyncHandler(async (req: Request<{}, {}, {}, GeneratePasswordQuery>) => {
    const length = req.query.length;
    const password = generatePassword(length);
    
    return { data: { password } };
});
