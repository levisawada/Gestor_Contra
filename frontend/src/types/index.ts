export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export interface SafePasswordEntry {
    id: string;
    userId: string;
    title: string;
    siteUrl?: string;
    username: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DecryptedPasswordEntry extends SafePasswordEntry {
    password: string;
}

// Estructura de respuesta que maneja nuestro middleware global del backend
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
}
