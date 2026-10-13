import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { passwordsApi } from '../api/passwords.api';
import { SafePasswordEntry } from '../types';
import { PasswordCard } from '../components/PasswordCard';
import { PasswordModal } from '../components/PasswordModal';
import { SessionTimerBanner } from '../components/SessionTimerBanner';

export default function VaultPage(): React.JSX.Element {
    const { user, masterPassword, isAuthenticated, logout, lock, secondsLeft, showWarning } = useAuth();
    const navigate = useNavigate();
    
    const [passwords, setPasswords] = useState<SafePasswordEntry[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Estado del Modal
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    // Redirigir inmediatamente si alguien intenta entrar a /vault sin sesión
    if (!isAuthenticated || !user || !masterPassword) {
        return <Navigate to="/" replace />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        loadPasswords();
    }, []);

    const loadPasswords = async () => {
        try {
            const data = await passwordsApi.getAll();
            setPasswords(data);
        } catch (error) {
            console.error('Error cargando contraseñas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleExitToMain = async () => {
        await lock(); // Cierra el candado (destruye la cookie), deja el PIN intacto en DB
        navigate('/');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás totalmente seguro de eliminar esta contraseña? No hay marcha atrás.')) {
            try {
                await passwordsApi.delete(id);
                loadPasswords();
            } catch (err: any) {
                alert(err.message || 'Error al eliminar');
            }
        }
    };

    const openModal = (mode: 'create' | 'edit' | 'view', id: string | null = null) => {
        setSelectedEntryId(id);
        setModalMode(mode);
    };

    // Búsqueda en el cliente (instantánea)
    const filteredPasswords = passwords.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) || 
        p.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-950 text-gray-200 relative">
            {showWarning && <SessionTimerBanner secondsLeft={secondsLeft} />}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                        <span className="text-3xl">🗄️</span>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-tight">Mi Bóveda</h1>
                            <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="🔍 Buscar contraseñas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:border-blue-500 transition-colors text-white"
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                onClick={handleExitToMain} 
                                className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors whitespace-nowrap"
                            >
                                Salir al Main
                            </button>
                            <button 
                                onClick={handleLogout} 
                                className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 pb-24">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-white">Tus Contraseñas</h2>
                    <button 
                        onClick={() => openModal('create')}
                        className="px-5 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
                    >
                        + Nueva Contraseña
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-700 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : filteredPasswords.length === 0 ? (
                    <div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-12 text-center mt-10">
                        <span className="text-6xl block mb-4">👻</span>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {search ? 'No se encontraron resultados' : 'Tu bóveda está vacía'}
                        </h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            {search 
                                ? `Ninguna contraseña coincide con "${search}". Intenta con otro término.` 
                                : 'Aún no has guardado nada. Haz clic en "Nueva Contraseña" para empezar a proteger tus cuentas.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredPasswords.map(entry => (
                            <PasswordCard 
                                key={entry.id} 
                                entry={entry}
                                onView={(id) => openModal('view', id)}
                                onEdit={(id) => openModal('edit', id)}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Maestro */}
            <PasswordModal 
                isOpen={modalMode !== null}
                mode={modalMode || 'view'}
                entryId={selectedEntryId}
                masterPassword={masterPassword!}
                onClose={() => setModalMode(null)}
                onSuccess={loadPasswords}
            />
        </div>
    );
}
