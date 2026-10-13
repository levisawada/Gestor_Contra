import { ApiResponse } from '../types';
import { sessionManager } from '../hooks/useSession';

// En Vite las variables de entorno cliente se exponen en import.meta.env
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export async function apiRequest<T>(
    path: string,
    options: RequestInit & { masterPassword?: string } = {}
): Promise<T> {
    const { masterPassword, ...fetchOptions } = options;
    
    // Configura headers dinámicos
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Inyecta token Bearer si existe en la sesión activa
    const activeSession = sessionManager.getActiveUser();
    if (activeSession?.token) {
        headers['Authorization'] = `Bearer ${activeSession.token}`;
    }

    // Inyecta el header Zero-Knowledge si la petición lo requiere
    if (masterPassword) {
        headers['X-Master-Password'] = masterPassword;
    }

    // credentials: 'include' es VITAL para que la cookie JWT se envíe automáticamente
    // Incluye reintentos suaves por si el servidor local está terminando de arrancar al abrir la app
    let res: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            res = await fetch(`${API_BASE}${path}`, {
                ...fetchOptions,
                headers,
                credentials: 'include', 
            });
            break;
        } catch {
            // Espera 350ms antes del siguiente reintento
            await new Promise(r => setTimeout(r, 350));
        }
    }

    if (!res) {
        throw new Error('No se pudo conectar con el servidor local');
    }
    
    let responseBody: ApiResponse<T>;
    try {
        responseBody = await res.json();
    } catch {
        throw new Error('Error de conexión con el servidor (Respuesta no válida)');
    }

    // Si el backend devuelve un status de error, lanzamos una excepción con el mensaje del backend
    if (!res.ok) {
        throw new Error(responseBody.message || 'Error desconocido del servidor');
    }
    
    // El frontend espera directamente la data
    return responseBody.data as T;
}
