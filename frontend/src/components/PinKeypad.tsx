
interface PinKeypadProps {
    pin: string;
    setPin: (pin: string) => void;
    onComplete: (pin: string) => void;
    disabled?: boolean;
}

export function PinKeypad({ pin, setPin, onComplete, disabled }: PinKeypadProps) {
    const handleNumber = (num: string) => {
        if (disabled || pin.length >= 4) return;
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 4) {
            onComplete(newPin);
        }
    };

    const handleBackspace = () => {
        if (disabled || pin.length === 0) return;
        setPin(pin.slice(0, -1));
    };

    // 4 círculos visuales
    const circles = Array.from({ length: 4 }).map((_, i) => (
        <div 
            key={i} 
            className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                i < pin.length ? 'bg-white border-white scale-110' : 'border-gray-500 bg-transparent'
            }`}
        />
    ));

    // Distribución clásica de teclado
    const buttons = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', '⌫']
    ];

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-xs mx-auto">
            {/* Visualizador de Círculos */}
            <div className="flex gap-5 mb-2 h-8 items-center">
                {circles}
            </div>

            {/* Grid del Teclado */}
            <div className="grid grid-cols-3 gap-4 w-full">
                {buttons.flat().map((btn, i) => (
                    <button
                        key={i}
                        disabled={disabled || btn === ''}
                        onClick={() => btn === '⌫' ? handleBackspace() : handleNumber(btn)}
                        className={`h-16 w-16 mx-auto rounded-full text-2xl font-medium transition-colors ${
                            btn === '' 
                                ? 'opacity-0 cursor-default pointer-events-none' 
                                : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600 shadow-md border border-gray-700'
                        }`}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
}
