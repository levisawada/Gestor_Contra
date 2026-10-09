import React, { useState } from 'react';
import { passwordsApi } from '../api/passwords.api';

interface PasswordGeneratorProps {
    onGenerate: (password: string) => void;
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
    const [length, setLength] = useState(16);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await passwordsApi.generate(length);
            onGenerate(res.password);
        } catch (err) {
            console.error("Error al generar contraseña:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <div className="flex items-center gap-3 flex-1 w-full">
                <label className="text-xs text-gray-400 font-medium whitespace-nowrap w-24">Longitud: {length}</label>
                <input 
                    type="range" 
                    min="6" max="64" 
                    value={length} 
                    onChange={e => setLength(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
            </div>
            <button 
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-md hover:bg-blue-600/30 active:bg-blue-600/40 transition-colors text-sm font-bold whitespace-nowrap disabled:opacity-50"
            >
                ⚡ Generar
            </button>
        </div>
    );
}
