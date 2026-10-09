import { apiRequest } from './client';
import { SafePasswordEntry, DecryptedPasswordEntry } from '../types';

export interface CreatePasswordPayload {
    title: string;
    siteUrl?: string;
    username: string;
    password?: string;
    notes?: string;
}

export const passwordsApi = {
    // Obtiene la metadata (sin la clave real descifrada)
    getAll: () => 
        apiRequest<SafePasswordEntry[]>('/passwords'),

    // Obtiene una contraseña DESCIFRADA (requiere enviar masterPassword al backend)
    getOne: (id: string, masterPassword: string) => 
        apiRequest<DecryptedPasswordEntry>(`/passwords/${id}`, {
            masterPassword // Envía el X-Master-Password header
        }),

    // Crea una nueva (la cifra en el backend usando masterPassword)
    create: (payload: CreatePasswordPayload, masterPassword: string) => 
        apiRequest<SafePasswordEntry>('/passwords', {
            method: 'POST',
            body: JSON.stringify(payload),
            masterPassword
        }),

    // Actualiza. Si cambias el 'password', debes enviar masterPassword para re-cifrar
    update: (id: string, payload: Partial<CreatePasswordPayload>, masterPassword: string) => 
        apiRequest<SafePasswordEntry>(`/passwords/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            masterPassword
        }),

    // Elimina
    delete: (id: string) => 
        apiRequest<boolean>(`/passwords/${id}`, { method: 'DELETE' }),

    // Generador criptográfico (Público, sin auth)
    generate: (length: number = 16) => 
        apiRequest<{ password: string }>(`/passwords/generate?length=${length}`)
};
