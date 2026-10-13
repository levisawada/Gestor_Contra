import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { sessionManager } from '../hooks/useSession';
import { usersApi } from '../api/users.api';
import { useSessionTimer } from '../hooks/useSessionTimer';

interface AuthContextType {
    user: User | null;
    masterPassword: string | null;
    isAuthenticated: boolean;
    secondsLeft: number;
    showWarning: boolean;
    setAuth: (user: User, masterPassword: string, token?: string) => void;
    lock: () => Promise<void>;
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
    const setAuth = (newUser: User, newMasterPassword: string, token?: string) => {
        setUser(newUser);
        setMasterPassword(newMasterPassword);
        sessionManager.save(newUser.id, { user: newUser, masterPassword: newMasterPassword, token });
    };

    // useCallback evita que el timer se reinicie en cada re-render
    const lock = useCallback(async () => {
        try {
            await usersApi.lock();
        } catch (e) {} // Ignorar errores de red
        sessionStorage.removeItem('gestor_active_user');
        setUser(null);
        setMasterPassword(null);
    }, []);

    const logout = useCallback(async () => {
        try {
            await usersApi.logout();
        } catch (e) {}
        finally {
            if (user) sessionManager.clear(user.id);
            setUser(null);
            setMasterPassword(null);
        }
    }, [user]);

    // El timer arranca cuando hay sesión activa. Al llegar a 0 hace lock automático.
    const { secondsLeft, showWarning } = useSessionTimer(
        !!user && !!masterPassword,
        lock
    );

    if (isRestoring) {
        return null;
    }

    return (
        <AuthContext.Provider value={{
            user,
            masterPassword,
            isAuthenticated: !!user && !!masterPassword,
            secondsLeft,
            showWarning,
            setAuth,
            lock,
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
