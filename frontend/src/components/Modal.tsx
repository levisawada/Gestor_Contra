import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                <div className="flex justify-between items-center p-5 border-b border-gray-800">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
