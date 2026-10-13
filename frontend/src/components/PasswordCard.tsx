import { SafePasswordEntry } from '../types';

interface PasswordCardProps {
    entry: SafePasswordEntry;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export function PasswordCard({ entry, onView, onEdit, onDelete }: PasswordCardProps) {
    return (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-800/80 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 shrink-0 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold text-gray-300">
                    {entry.title.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <h3 className="text-white font-semibold text-lg leading-tight truncate">{entry.title}</h3>
                    <div className="text-sm text-gray-400 flex items-center gap-2 mt-1 truncate">
                        <span className="truncate">{entry.username}</span>
                        {entry.siteUrl && (
                            <>
                                <span>•</span>
                                <a 
                                    href={entry.siteUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-blue-400 hover:text-blue-300 hover:underline shrink-0"
                                >
                                    Abrir web
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button 
                    onClick={() => onView(entry.id)} 
                    className="px-4 py-2 text-sm font-medium bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition-colors"
                >
                    Ver
                </button>
                <button 
                    onClick={() => onEdit(entry.id)} 
                    className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    Editar
                </button>
                <button 
                    onClick={() => onDelete(entry.id)} 
                    className="px-4 py-2 text-sm font-medium bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
}
