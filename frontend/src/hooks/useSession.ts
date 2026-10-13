import { User } from '../types';

export interface SessionData {
    user: User;
    masterPassword: string;
    token?: string;
}

/**
 * sessionManager maneja el sessionStorage para mantener vivo el masterPassword
 * y la información del usuario a través de recargas (F5).
 * Al cerrar la pestaña, esta información se destruye automáticamente por seguridad.
 */
export const sessionManager = {
    // Guarda los datos de la sesión para un usuario específico y lo marca como activo
    save: (userId: string, data: SessionData) => {
        sessionStorage.setItem(`gestor_session_${userId}`, JSON.stringify(data));
        sessionStorage.setItem(`gestor_active_user`, userId);
    },

    // Obtiene los datos guardados (masterPassword y usuario) de un perfil
    get: (userId: string): SessionData | null => {
        const data = sessionStorage.getItem(`gestor_session_${userId}`);
        return data ? JSON.parse(data) : null;
    },

    // Obtiene el perfil que quedó activo antes de un F5
    getActiveUser: (): SessionData | null => {
        const activeId = sessionStorage.getItem(`gestor_active_user`);
        if (!activeId) return null;
        return sessionManager.get(activeId);
    },

    // Elimina rastro de este usuario (Ej: al hacer logout explícito)
    clear: (userId: string) => {
        sessionStorage.removeItem(`gestor_session_${userId}`);
        const activeId = sessionStorage.getItem(`gestor_active_user`);
        if (activeId === userId) {
            sessionStorage.removeItem(`gestor_active_user`);
        }
    }
};
