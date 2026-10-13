import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import { sessionManager } from '../hooks/useSession';
import { PinKeypad } from '../components/PinKeypad';
import { Modal } from '../components/Modal';

export default function AuthPage(): React.JSX.Element {
    const { userId } = useParams<{ userId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setAuth } = useAuth();
    
    // "full" o "pin"
    const mode = searchParams.get('mode') ?? 'full';

    // Estados
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal para mostrar el PIN tras full-login
    const [showPinModal, setShowPinModal] = useState(false);
    const [generatedPin, setGeneratedPin] = useState('');

    // Validar que tengamos masterPassword en sessionStorage si entramos a modo PIN
    useEffect(() => {
        if (mode === 'pin' && userId) {
            const session = sessionManager.get(userId);
            if (!session || !session.masterPassword) {
                // Forzar full login si perdimos la masterPassword de la memoria
                setSearchParams({ mode: 'full' });
            }
        }
    }, [mode, userId, setSearchParams]);

    const handleFullLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await usersApi.login(email, password);
            // Guardamos la sesión en el context y sessionStorage (incluyendo el token)
            setAuth(res.user, password, res.token);
            setGeneratedPin(res.pin);
            setShowPinModal(true); // Mostrar modal antes de ir al vault
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinLogin = async (completedPin: string) => {
        setError('');
        setIsLoading(true);
        try {
            if (!userId) throw new Error("No hay usuario identificado");
            const session = sessionManager.get(userId);
            if (!session) throw new Error("Sesión local expirada");

            const res = await usersApi.quickLogin(userId, completedPin);
            setAuth(res.user, session.masterPassword, res.token || session.token);
            navigate('/vault');
        } catch (err: any) {
            setError(err.message || 'PIN incorrecto o sesión expirada');
            setPin(''); // Resetear PIN para que vuelva a intentar
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinModalClose = () => {
        setShowPinModal(false);
        navigate('/vault');
    };

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-12 px-4 relative">
            <button 
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 font-medium transition-colors"
            >
                ← Volver a perfiles
            </button>

            <div className="w-full max-w-md">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <span className="text-5xl block mb-4">{mode === 'pin' ? '🔢' : '🔑'}</span>
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'pin' ? 'Ingresa tu PIN de sesión' : 'Iniciar Sesión'}
                        </h2>
                        {mode === 'pin' && (
                            <p className="text-gray-400 text-sm mt-2">Acceso rápido a tu bóveda</p>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 text-red-300 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    {mode === 'full' ? (
                        <form onSubmit={handleFullLogin} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1.5">Contraseña Maestra</label>
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="mt-2 w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Autenticando...' : 'Entrar a la Bóveda'}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center">
                            <PinKeypad 
                                pin={pin} 
                                setPin={setPin} 
                                onComplete={handlePinLogin}
                                disabled={isLoading} 
                            />
                            <button
                                onClick={() => setSearchParams({ mode: 'full' })}
                                className="mt-8 text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4"
                            >
                                Olvidé mi PIN / Usar contraseña completa
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para mostrar el PIN generado después de login exitoso */}
            <Modal isOpen={showPinModal} onClose={handlePinModalClose} title="¡Sesión Rápida Activa!">
                <div className="text-center">
                    <p className="text-gray-300 mb-6 text-sm">
                        Si sales de tu perfil, puedes volver a entrar usando este PIN. Solo durará 15 minutos o hasta que cierres sesión manualmente.
                    </p>
                    <div className="text-5xl tracking-[0.3em] pl-4 text-white bg-gray-800 py-6 rounded-xl border border-gray-700 mb-6 font-mono font-bold">
                        {generatedPin}
                    </div>
                    <button
                        onClick={handlePinModalClose}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Entendido, ir a mi bóveda
                    </button>
                </div>
            </Modal>
        </div>
    );
}
