import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { usersApi } from '../api/users.api';
import { ProfileCard } from '../components/ProfileCard';
import { Modal } from '../components/Modal';

export default function ProfilesPage(): React.JSX.Element {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Estado del formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (err) {
            console.error('Error cargando perfiles:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileClick = async (user: User) => {
        try {
            // Revisa si tiene sesión viva en DB para decidir a qué pantalla llevarlo
            const res = await usersApi.hasSession(user.id);
            if (res.hasActivePin) {
                navigate(`/auth/${user.id}?mode=pin`);
            } else {
                navigate(`/auth/${user.id}?mode=full`);
            }
        } catch (e) {
            navigate(`/auth/${user.id}?mode=full`);
        }
    };

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await usersApi.register(email, password);
            await loadUsers(); // Refrescar la lista
            setIsModalOpen(false);
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setError(err.message || 'Error al crear perfil');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                Cargando perfiles...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-12 px-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-16 text-center">
                ¿Quién está usando el gestor?
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-10 max-w-4xl">
                {users.map(user => (
                    <ProfileCard key={user.id} user={user} onClick={handleProfileClick} />
                ))}
                
                {/* Botón de agregar perfil */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex flex-col items-center gap-3 group transition-transform hover:scale-105"
                >
                    <div className="w-32 h-32 bg-gray-900 rounded-xl flex items-center justify-center text-5xl text-gray-500 border-2 border-transparent group-hover:border-gray-400 group-hover:text-gray-300 transition-colors">
                        +
                    </div>
                    <span className="text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                        Añadir Perfil
                    </span>
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Perfil">
                <form onSubmit={handleCreateProfile} className="flex flex-col gap-5">
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-300 rounded text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="tu@email.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Contraseña Maestra</label>
                        <input 
                            type="password" 
                            required
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            Esta es la única contraseña que deberás recordar. 
                            <strong> No se guarda en ningún servidor</strong>, si la olvidas perderás el acceso a tus datos para siempre.
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="mt-2 w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creando...' : 'Crear Perfil'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
