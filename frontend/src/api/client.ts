import { ApiResponse } from '../types';

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

    // Inyecta el header Zero-Knowledge si la petición lo requiere
    if (masterPassword) {
        headers['X-Master-Password'] = masterPassword;
    }

    // credentials: 'include' es VITAL para que la cookie JWT se envíe automáticamente
    const res = await fetch(`${API_BASE}${path}`, {
        ...fetchOptions,
        headers,
        credentials: 'include', 
    });
    
    let responseBody: ApiResponse<T>;
    try {
        responseBody = await res.json();
    } catch (err) {
        throw new Error('Error de conexión con el servidor (Respuesta no válida)');
    }

    // Si el backend devuelve un status de error, lanzamos una excepción con el mensaje del backend
    if (!res.ok) {
        throw new Error(responseBody.message || 'Error desconocido del servidor');
    }
    
    // El frontend espera directamente la data
    return responseBody.data as T;
}
