import bcrypt from 'bcrypt';
import { db } from '../db'; // Instancia de Drizzle
import { users, NewUser, User } from '../db/schema';
import { GetUserByIdParams, RegisterUserInput } from '../schemas';
import { eq } from 'drizzle-orm';

export class UserService {
    static async register(
        input: RegisterUserInput
    ): Promise<Omit<User, 'password'>> {
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email));

        if (existingUser) {
            throw new Error('El correo electrónico ya está registrado');
        }

        const hashedPassword = await bcrypt.hash(input.password, 10);

        const newUser: NewUser = {
            email: input.email,
            password: hashedPassword,
        };

        const [createdUser] = await db
            .insert(users)
            .values(newUser)
            .returning();

        const { password, ...userWithoutPassword } = createdUser;
        return userWithoutPassword;
    }

    static async getAll(): Promise<Omit<User, 'password'>[]> {
        const allUsers = await db.select().from(users);

        return allUsers.map(
            ({ password, ...userWithoutPassword }) => userWithoutPassword
        );
    }

    static async getOne(
        id: GetUserByIdParams['id']
    ): Promise<Omit<User, 'password'> | null> {
        const [user] = await db.select().from(users).where(eq(users.id, id));

        if (!user) {
            return null;
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    static async update(
        id: GetUserByIdParams['id'],
        input: Partial<NewUser>
    ): Promise<Omit<User, 'password'> | null> {
        const [updatedUser] = await db
            .update(users)
            .set(input)
            .where(eq(users.id, id))
            .returning();

        if (!updatedUser) {
            return null;
        }

        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }

    static async delete(id: GetUserByIdParams['id']): Promise<boolean> {
        const [deleted] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning();

        return !!deleted;
    }
}
