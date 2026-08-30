import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Password-entry schemas
// ---------------------------------------------------------------------------

export const createPasswordEntrySchema = z.object({
    title: z.string().min(1).max(150),
    siteUrl: z.string().url().optional().or(z.literal('')),
    username: z.string().min(1).max(150),
    password: z.string().min(1),
    notes: z.string().optional(),
});

export const updatePasswordEntrySchema = createPasswordEntrySchema.partial();

// ---------------------------------------------------------------------------
// Inferred TS types
// ---------------------------------------------------------------------------

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type CreatePasswordEntryInput = z.infer<
    typeof createPasswordEntrySchema
>;
export type UpdatePasswordEntryInput = z.infer<
    typeof updatePasswordEntrySchema
>;
