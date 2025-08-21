
import React, { ReactNode } from 'react';

interface ModalProps {
    title: string;
    children: ReactNode;
    onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-purple-500/50 rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-4 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-purple-300">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>
    );
};
