import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerUserSchema = z.object({
    body: z.object({
        email: z.string().trim().email('El correo electrónico no es válido'),
        password: z
            .string()
            .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    }),
});

export const loginUserSchema = z.object({
    body: z.object({
        email: z.string().trim().email('El correo electrónico no es válido'),
        password: z.string().min(1, 'La contraseña es requerida'),
    }),
});

export const getUserByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('El ID debe ser un UUID válido'),
    }),
});

export const updateUserSchema = z.object({
    params: getUserByIdSchema.shape.params,
    body: registerUserSchema.shape.body
        .partial()
        .refine((data) => Object.keys(data).length > 0, {
            message: 'Debe proporcionar al menos un campo para actualizar',
        }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];

// ---------------------------------------------------------------------------
// Password-entry schemas
// ---------------------------------------------------------------------------

export const createPasswordEntrySchema = z.object({
    title: z.string().trim().min(1, 'El título es requerido').max(150),
    siteUrl: z
        .string()
        .trim()
        .optional()
        .or(z.literal(''))
        .transform((val) => (val === '' ? undefined : val)),
    username: z.string().trim().min(1, 'El usuario es requerido').max(150),
    password: z.string().min(6, 'La contraseña es requerida'),
    notes: z.string().trim().optional(),
});

export const updatePasswordEntrySchema = createPasswordEntrySchema
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar',
    });

// ---------------------------------------------------------------------------
// Inferred TS types
// ---------------------------------------------------------------------------

export type RegisterUserInput = z.infer<typeof registerUserSchema>['body'];
export type LoginUserInput = z.infer<typeof loginUserSchema>['body'];
export type GetUserByIdParams = z.infer<typeof getUserByIdSchema>['params'];
export type CreatePasswordEntryInput = z.infer<
    typeof createPasswordEntrySchema
>;
export type UpdatePasswordEntryInput = z.infer<
    typeof updatePasswordEntrySchema
>;

// ---------------------------------------------------------------------------
// Quick-login schema (PIN de sesión)
// ---------------------------------------------------------------------------

export const quickLoginSchema = z.object({
    body: z.object({
        userId: z.string().uuid('El ID de usuario debe ser un UUID válido'),
        pin: z
            .string()
            .length(4, 'El PIN debe tener exactamente 4 dígitos')
            .regex(/^\d{4}$/, 'El PIN solo puede contener dígitos numéricos'),
    }),
});

export type QuickLoginInput = z.infer<typeof quickLoginSchema>['body'];

// ---------------------------------------------------------------------------
// Wrapper schemas para rutas de Passwords
// ---------------------------------------------------------------------------

// Envolver en { body: ... } para el middleware validate()
export const createPasswordEntryBodySchema = z.object({
    body: createPasswordEntrySchema
});

export const updatePasswordEntryBodySchema = z.object({
    body: updatePasswordEntrySchema
});

// ID de entrada de contraseña (para parámetros de ruta)
export const passwordEntryIdSchema = z.object({
    params: z.object({
        id: z.string().uuid('El ID debe ser un UUID válido'),
    }),
});

// Generador — query param ?length=12
export const generatePasswordSchema = z.object({
    query: z.object({
        length: z.coerce
            .number()
            .int('La longitud debe ser un entero')
            .min(6, 'La longitud mínima es 6')
            .max(128, 'La longitud máxima es 128')
            .default(6),
    }).default({}),
});

export type PasswordEntryIdParams = z.infer<typeof passwordEntryIdSchema>['params'];
export type GeneratePasswordQuery = z.infer<typeof generatePasswordSchema>['query'];
