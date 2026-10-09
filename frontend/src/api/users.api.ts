import { apiRequest } from './client';
import { User } from '../types';

export const usersApi = {
    // Para la pantalla principal (Netflix-style)
    getAll: () => 
        apiRequest<User[]>('/users'),
    
    // Para decidir si mostramos PIN o Full Login
    hasSession: (userId: string) => 
        apiRequest<{ hasActivePin: boolean }>(`/users/${userId}/has-session`),
    
    // Registro
    register: (email: string, masterPassword: string) => 
        apiRequest<{ user: User }>('/users/register', {
            method: 'POST',
            body: JSON.stringify({ email, password: masterPassword })
        }),
        
    // Full login (Genera PIN y Cookie)
    login: (email: string, masterPassword: string) => 
        apiRequest<{ user: User, pin: string }>('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: masterPassword })
        }),
        
    // Quick login (Renueva Cookie con PIN)
    quickLogin: (userId: string, pin: string) => 
        apiRequest<{ user: User }>('/users/quick-login', {
            method: 'POST',
            body: JSON.stringify({ userId, pin })
        }),
        
    // Limpia Cookie y borra PIN de DB
    logout: () => 
        apiRequest<void>('/users/logout', { method: 'POST' })
};
