import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * T6 — VaultPage
 * Dashboard de contraseñas del perfil autenticado.
 * Implementación completa en la tarea T6.
 */
export default function VaultPage(): React.JSX.Element {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
            <span className="text-4xl">🗄️</span>
            <h2 className="text-xl font-bold text-white">Bóveda de Contraseñas</h2>
            <p className="text-gray-400 text-sm">Dashboard — próximamente T6</p>
            <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 text-sm"
            >
                ← Volver al inicio
            </button>
        </div>
    );
}
