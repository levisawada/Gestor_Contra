import { User } from '../types';

interface ProfileCardProps {
    user: User;
    onClick: (user: User) => void;
}

export function ProfileCard({ user, onClick }: ProfileCardProps) {
    // Extrae la primera letra para el avatar (ej: juan@... -> J)
    const initial = user.email.charAt(0).toUpperCase();
    
    // Hash ultra simple para asignar un color distinto a cada correo de forma consistente
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600'];
    const colorIndex = user.email.length % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <button 
            onClick={() => onClick(user)}
            className="flex flex-col items-center gap-3 group transition-transform hover:scale-105"
        >
            <div className={`w-32 h-32 ${bgColor} rounded-xl shadow-lg flex items-center justify-center text-5xl font-bold text-white border-2 border-transparent group-hover:border-white transition-colors`}>
                {initial}
            </div>
            <span className="text-gray-300 font-medium group-hover:text-white transition-colors max-w-[8rem] truncate text-center">
                {user.email.split('@')[0]}
            </span>
        </button>
    );
}
