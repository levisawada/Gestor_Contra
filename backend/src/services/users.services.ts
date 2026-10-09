import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, NewUser, User } from '../db/schema';
import {
    GetUserByIdParams,
    LoginUserInput,
    QuickLoginInput,
    RegisterUserInput,
} from '../schemas';
import { eq } from 'drizzle-orm';
import { generateSessionPin, getPinExpiresAt } from '../utils/jwt.utils';

// Tipo público que omite campos sensibles de la respuesta
type SafeUser = Omit<User, 'password' | 'sessionPin' | 'sessionPinExpiresAt'>;

/** Extrae los campos seguros de un objeto User (sin password ni PIN). */
function toSafeUser(user: User): SafeUser {
    const { password, sessionPin, sessionPinExpiresAt, ...safe } = user;
    return safe;
}

export class UserService {
    // -----------------------------------------------------------------------
    // CRUD básico
    // -----------------------------------------------------------------------

    static async register(input: RegisterUserInput): Promise<SafeUser> {
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email));

        if (existingUser) {
            throw new Error('El correo electrónico ya está registrado');
        }

        const saltNumber = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(input.password, saltNumber);

        const newUser: NewUser = {
            email: input.email,
            password: hashedPassword,
        };

        const [createdUser] = await db.insert(users).values(newUser).returning();
        return toSafeUser(createdUser);
    }

    static async getAll(): Promise<SafeUser[]> {
        const allUsers = await db.select().from(users);
        return allUsers.map(toSafeUser);
    }

    static async getOne(id: GetUserByIdParams['id']): Promise<SafeUser | null> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user ? toSafeUser(user) : null;
    }

    static async update(
        id: GetUserByIdParams['id'],
        input: Partial<NewUser>
    ): Promise<SafeUser | null> {
        const [updatedUser] = await db
            .update(users)
            .set(input)
            .where(eq(users.id, id))
            .returning();

        return updatedUser ? toSafeUser(updatedUser) : null;
    }

    static async delete(id: GetUserByIdParams['id']): Promise<boolean> {
        const [deleted] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning();
        return !!deleted;
    }

    // -----------------------------------------------------------------------
    // Autenticación
    // -----------------------------------------------------------------------

    /**
     * Verifica si un usuario tiene una sesión de PIN activa y no expirada.
     * Usado por el endpoint público `GET /users/:id/has-session`.
     */
    static async checkSession(userId: string): Promise<boolean> {
        const [user] = await db
            .select({ sessionPin: users.sessionPin, sessionPinExpiresAt: users.sessionPinExpiresAt })
            .from(users)
            .where(eq(users.id, userId));

        if (!user || !user.sessionPin || !user.sessionPinExpiresAt) return false;
        return new Date(user.sessionPinExpiresAt) > new Date();
    }

    /**
     * Valida email + contraseña, genera un PIN de sesión de 4 dígitos,
     * lo persiste en DB con TTL de 15 min y devuelve el usuario seguro + el PIN.
     */
    static async login(
        input: LoginUserInput
    ): Promise<{ user: SafeUser; pin: string } | null> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email));

        if (!user) return null;

        const isPasswordCorrect = await bcrypt.compare(
            input.password,
            user.password
        );
        if (!isPasswordCorrect) return null;

        // Generar PIN y guardarlo en DB (sobreescribe cualquier PIN previo)
        const pin = generateSessionPin();
        const sessionPinExpiresAt = getPinExpiresAt();

        await db
            .update(users)
            .set({ sessionPin: pin, sessionPinExpiresAt })
            .where(eq(users.id, user.id));

        return { user: toSafeUser(user), pin };
    }

    /**
     * Valida userId + PIN contra el PIN almacenado en DB.
     * Si es correcto y no expiró, renueva el TTL del PIN 15 min más.
     */
    static async quickLogin(input: QuickLoginInput): Promise<SafeUser | null> {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, input.userId));

        if (!user || !user.sessionPin || !user.sessionPinExpiresAt) return null;

        // Verificar expiración del PIN
        if (new Date(user.sessionPinExpiresAt) < new Date()) {
            // PIN expirado → limpiar de DB
            await db
                .update(users)
                .set({ sessionPin: null, sessionPinExpiresAt: null })
                .where(eq(users.id, input.userId));
            return null;
        }

        // Verificar que el PIN coincida
        if (user.sessionPin !== input.pin) return null;

        // PIN válido → renovar expiración (15 min adicionales)
        await db
            .update(users)
            .set({ sessionPinExpiresAt: getPinExpiresAt() })
            .where(eq(users.id, input.userId));

        return toSafeUser(user);
    }

    /**
     * Invalida la sesión: borra la cookie (en el controlador) y
     * elimina el PIN de DB para que quick-login ya no funcione.
     */
    static async logout(userId: string): Promise<void> {
        await db
            .update(users)
            .set({ sessionPin: null, sessionPinExpiresAt: null })
            .where(eq(users.id, userId));
    }
}
