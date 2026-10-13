
interface SessionTimerBannerProps {
    secondsLeft: number;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/**
 * Banner de advertencia que aparece en los últimos 5 minutos de sesión.
 * Cambia de amarillo a rojo al acercarse a 0.
 */
export function SessionTimerBanner({ secondsLeft }: SessionTimerBannerProps) {
    const isCritical = secondsLeft <= 60; // Último minuto → rojo

    return (
        <div
            className={`w-full px-6 py-2.5 flex items-center justify-center gap-3 text-sm font-medium transition-colors ${
                isCritical
                    ? 'bg-red-900/50 border-b border-red-500/60 text-red-200'
                    : 'bg-amber-900/40 border-b border-amber-500/50 text-amber-200'
            }`}
        >
            <span className={`text-base ${isCritical ? 'animate-pulse' : ''}`}>
                {isCritical ? '🔴' : '⏱'}
            </span>
            <span>
                Tu sesión expirará en{' '}
                <strong className="font-mono text-base tracking-widest">
                    {formatTime(secondsLeft)}
                </strong>
                {isCritical
                    ? ' — la sesión se cerrará automáticamente.'
                    : ' — guarda tu trabajo antes de que se cierre.'}
            </span>
        </div>
    );
}
