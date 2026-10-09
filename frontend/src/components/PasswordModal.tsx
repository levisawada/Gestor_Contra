import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { PasswordGenerator } from './PasswordGenerator';
import { passwordsApi, CreatePasswordPayload } from '../api/passwords.api';

interface PasswordModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    entryId: string | null;
    masterPassword: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function PasswordModal({ isOpen, mode, entryId, masterPassword, onClose, onSuccess }: PasswordModalProps) {
    const [formData, setFormData] = useState<CreatePasswordPayload>({
        title: '', siteUrl: '', username: '', password: '', notes: ''
    });
    const [decryptedPassword, setDecryptedPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Reinicia el estado cuando el modal se abre/cierra o cambia de modo
    useEffect(() => {
        if (isOpen) {
            setError('');
            setCopied(false);
            setDecryptedPassword('');
            if (mode === 'create') {
                setFormData({ title: '', siteUrl: '', username: '', password: '', notes: '' });
            } else if (entryId) {
                loadEntryData();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, entryId]);

    const loadEntryData = async () => {
        if (!entryId) return;
        setIsLoading(true);
        try {
            // Usa el masterPassword para desencriptar. 
            // En 'view' mostramos la clave. En 'edit' no la mostramos por defecto hasta que la quieran cambiar.
            const data = await passwordsApi.getOne(entryId, masterPassword);
            setFormData({
                title: data.title,
                siteUrl: data.siteUrl || '',
                username: data.username,
                password: '', 
                notes: data.notes || ''
            });
            if (mode === 'view') {
                setDecryptedPassword(data.password);
            }
        } catch (err: any) {
            setError(err.message || 'Error al cargar (¿Contraseña maestra incorrecta?)');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (mode === 'create') {
                await passwordsApi.create(formData, masterPassword);
            } else if (mode === 'edit' && entryId) {
                const updatePayload = { ...formData };
                // Si el usuario dejó el campo de contraseña vacío en edición, no lo actualizamos en la DB
                if (!updatePayload.password) {
                    delete updatePayload.password;
                }
                await passwordsApi.update(entryId, updatePayload, masterPassword);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(decryptedPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    const titles = {
        create: 'Nueva Contraseña',
        edit: 'Editar Contraseña',
        view: 'Detalle Descifrado'
    };

    // ==========================================
    // VISTA: Ver contraseña descifrada
    // ==========================================
    if (mode === 'view') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={formData.title || 'Cargando...'}>
                {isLoading ? (
                    <div className="flex justify-center p-6"><div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div></div>
                ) : error ? (
                    <div className="text-red-400 p-4 text-center">{error}</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Usuario / Correo</label>
                            <div className="text-white font-medium">{formData.username}</div>
                        </div>
                        
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Contraseña Descifrada</label>
                            <div className="flex items-center justify-between gap-4 mt-2">
                                <div className="text-white font-mono text-xl break-all tracking-wide">{decryptedPassword}</div>
                                <button 
                                    onClick={handleCopy}
                                    className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 active:scale-95 transition-all text-sm font-bold flex-shrink-0"
                                >
                                    {copied ? '¡Copiada! ✓' : 'Copiar'}
                                </button>
                            </div>
                        </div>

                        {formData.siteUrl && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Sitio Web</label>
                                <a href={formData.siteUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">{formData.siteUrl}</a>
                            </div>
                        )}

                        {formData.notes && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 block">Notas</label>
                                <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{formData.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        );
    }

    // ==========================================
    // VISTA: Formulario Crear / Editar
    // ==========================================
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={titles[mode]}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-300 rounded text-sm">{error}</div>}
                
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Título (Ej: Mi Banco)</label>
                    <input 
                        required
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Usuario o Email de la cuenta</label>
                    <input 
                        required
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">
                        {mode === 'edit' ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña Segura'}
                    </label>
                    <input 
                        type="text"
                        required={mode === 'create'}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono tracking-wide focus:outline-none focus:border-blue-500"
                    />
                    <PasswordGenerator onGenerate={pwd => setFormData({...formData, password: pwd})} />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">URL (Opcional)</label>
                    <input 
                        type="url"
                        value={formData.siteUrl}
                        onChange={e => setFormData({...formData, siteUrl: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Notas (Opcional)</label>
                    <textarea 
                        value={formData.notes}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 min-h-[5rem] resize-y"
                    />
                </div>

                <div className="flex gap-3 mt-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 bg-gray-800 border border-gray-700 text-white font-medium py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : 'Guardar en bóveda'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
