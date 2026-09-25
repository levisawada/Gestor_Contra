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
