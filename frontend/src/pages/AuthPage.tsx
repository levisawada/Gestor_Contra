import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

/**
 * T5 — AuthPage
 * Muestra full-login (email + contraseña) o keypad de PIN según ?mode=
 * El mode se determina consultando GET /users/:id/has-session al backend.
 * Implementación completa en la tarea T5.
 */
export default function AuthPage(): React.JSX.Element {
    const { userId } = useParams<{ userId: string }>();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? 'full';

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
            <span className="text-4xl">{mode === 'pin' ? '🔢' : '🔑'}</span>
            <h2 className="text-xl font-bold text-white">
                {mode === 'pin' ? 'Ingresa tu PIN' : 'Iniciar Sesión'}
            </h2>
            <p className="text-gray-400 text-sm">userId: {userId} — próximamente T5</p>
        </div>
    );
}
