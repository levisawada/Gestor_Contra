import { db } from '../db';
import { passwords, NewPasswordEntry, PasswordEntry } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { deriveKey, encrypt, decrypt } from '../utils/crypto.utils';
import { CreatePasswordEntryInput, UpdatePasswordEntryInput } from '../schemas';
import crypto from 'crypto';

// Tipo devuelto por la API (omite los campos sensibles de cifrado y el UUID interno)
export type SafePasswordEntry = Omit<PasswordEntry, 'encryptedPassword' | 'iv' | 'authTag'>;
export type DecryptedPasswordEntry = SafePasswordEntry & { password: string };

function toSafeEntry(entry: PasswordEntry): SafePasswordEntry {
    const { encryptedPassword, iv, authTag, ...safe } = entry;
    return safe;
}

export class PasswordService {
    // -------------------------------------------------------
    // GET /  — lista completa, sin descifrar
    // -------------------------------------------------------
    static async getAll(userId: string): Promise<SafePasswordEntry[]> {
        const entries = await db.select().from(passwords).where(eq(passwords.userId, userId));
        return entries.map(toSafeEntry);
    }

    // -------------------------------------------------------
    // GET /:id  — una entrada con contraseña descifrada
    // -------------------------------------------------------
    static async getOne(
        userId: string,
        passwordId: string,
        masterPassword: string
    ): Promise<DecryptedPasswordEntry | null> {
        const [entry] = await db
            .select()
            .from(passwords)
            .where(and(eq(passwords.id, passwordId), eq(passwords.userId, userId)));
            
        if (!entry) return null;

        const key = await deriveKey(masterPassword, userId);
        const plainPassword = decrypt({
            encryptedPassword: entry.encryptedPassword,
            iv: entry.iv,
            authTag: entry.authTag
        }, key);

        return { ...toSafeEntry(entry), password: plainPassword };
    }

    // -------------------------------------------------------
    // POST /  — cifra y guarda nueva entrada
    // -------------------------------------------------------
    static async create(
        userId: string,
        input: CreatePasswordEntryInput,
        masterPassword: string
    ): Promise<SafePasswordEntry> {
        const key = await deriveKey(masterPassword, userId);
        const { encryptedPassword, iv, authTag } = encrypt(input.password, key);

        const newEntry: NewPasswordEntry = {
            id: crypto.randomUUID(),
            userId,
            title: input.title,
            siteUrl: input.siteUrl,
            username: input.username,
            encryptedPassword,
            iv,
            authTag,
            notes: input.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const [created] = await db.insert(passwords).values(newEntry).returning();
        return toSafeEntry(created);
    }

    // -------------------------------------------------------
    // PATCH /:id  — actualiza campos, re-cifra si cambia password
    // -------------------------------------------------------
    static async update(
        userId: string,
        passwordId: string,
        input: UpdatePasswordEntryInput,
        masterPassword: string
    ): Promise<SafePasswordEntry | null> {
        // Verificar existencia y propiedad
        const [existing] = await db
            .select()
            .from(passwords)
            .where(and(eq(passwords.id, passwordId), eq(passwords.userId, userId)));
            
        if (!existing) return null;

        const updatePayload: Partial<NewPasswordEntry> = {};

        // Campos metadata
        if (input.title !== undefined) updatePayload.title = input.title;
        if (input.siteUrl !== undefined) updatePayload.siteUrl = input.siteUrl;
        if (input.username !== undefined) updatePayload.username = input.username;
        if (input.notes !== undefined) updatePayload.notes = input.notes;

        // Re-cifrado condicional
        if (input.password !== undefined) {
            const key = await deriveKey(masterPassword, userId);
            const { encryptedPassword, iv, authTag } = encrypt(input.password, key);
            
            updatePayload.encryptedPassword = encryptedPassword;
            updatePayload.iv = iv;
            updatePayload.authTag = authTag;
        }

        updatePayload.updatedAt = new Date().toISOString();

        const [updated] = await db.update(passwords)
            .set(updatePayload)
            .where(eq(passwords.id, passwordId))
            .returning();

        return toSafeEntry(updated);
    }

    // -------------------------------------------------------
    // DELETE /:id  — elimina (verifica que sea del userId)
    // -------------------------------------------------------
    static async delete(userId: string, passwordId: string): Promise<boolean> {
        const [deleted] = await db
            .delete(passwords)
            .where(and(eq(passwords.id, passwordId), eq(passwords.userId, userId)))
            .returning();
            
        return !!deleted;
    }
}
