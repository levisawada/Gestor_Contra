import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { sessionManager } from '../hooks/useSession';
import { usersApi } from '../api/users.api';

interface AuthContextType {
    user: User | null;
    masterPassword: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, masterPassword: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [masterPassword, setMasterPassword] = useState<string | null>(null);
    const [isRestoring, setIsRestoring] = useState(true);

    // Restaurar sesión activa si el usuario hizo F5
    useEffect(() => {
        const activeSession = sessionManager.getActiveUser();
        if (activeSession) {
            setUser(activeSession.user);
            setMasterPassword(activeSession.masterPassword);
        }
        setIsRestoring(false);
    }, []);

    // Actualiza el estado y lo guarda en sessionStorage
    const setAuth = (newUser: User, newMasterPassword: string) => {
        setUser(newUser);
        setMasterPassword(newMasterPassword);
        sessionManager.save(newUser.id, { user: newUser, masterPassword: newMasterPassword });
    };

    // Llama al backend para matar la cookie y luego borra el sessionStorage local
    const logout = async () => {
        try {
            await usersApi.logout();
        } catch (e) {
            // Ignoramos errores de red (ej: cookie ya había expirado)
        } finally {
            if (user) {
                sessionManager.clear(user.id);
            }
            setUser(null);
            setMasterPassword(null);
        }
    };

    if (isRestoring) {
        return null; // Evita parpadeos mientras restaura estado
    }

    return (
        <AuthContext.Provider value={{
            user,
            masterPassword,
            isAuthenticated: !!user && !!masterPassword,
            setAuth,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto más fácil
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
