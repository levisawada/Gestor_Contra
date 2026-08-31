import bcrypt from 'bcrypt';
import { db } from '../db'; // Instancia de Drizzle
import { users, NewUser, User } from '../db/schema';
import { RegisterUserInput } from '../schemas';
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

        // Removemos la contraseña de cada usuario antes de retornarlos
        return allUsers.map(
            ({ password, ...userWithoutPassword }) => userWithoutPassword
        );
    }
}
