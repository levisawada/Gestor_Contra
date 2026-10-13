import { useState, useEffect } from 'react';

const SESSION_DURATION = 15 * 60; // 15 minutos en segundos
const WARNING_THRESHOLD = 5 * 60; // Mostrar banner al llegar a 5 minutos

/**
 * Hook que gestiona el countdown de sesión.
 * - Arranca cuando `isAuthenticated` pasa a true.
 * - Resetea cuando `isAuthenticated` pasa a false (logout/lock).
 * - Llama a `onExpire` automáticamente cuando llega a 0.
 */
export function useSessionTimer(
    isAuthenticated: boolean,
    onExpire: () => void
) {
    const [secondsLeft, setSecondsLeft] = useState(SESSION_DURATION);

    useEffect(() => {
        // Al desautenticarse, resetea el contador para la próxima sesión
        if (!isAuthenticated) {
            setSecondsLeft(SESSION_DURATION);
            return;
        }

        // Arranca el countdown
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    // onExpire intencionalmente fuera de deps para evitar reinicios al re-render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    return {
        secondsLeft,
        /** true cuando faltan 5 minutos o menos */
        showWarning: isAuthenticated && secondsLeft <= WARNING_THRESHOLD && secondsLeft > 0,
        /** true cuando la sesión ya expiró */
        isExpired: secondsLeft === 0,
    };
}
