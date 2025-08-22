import React, { ReactNode } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

interface CollapsibleSectionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
    className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, onToggle, children, className }) => {
    return (
        <div className={`bg-white/5 rounded-lg transition-all duration-300 ${className}`}>
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-3 text-left"
            >
                <h2 className="text-xl font-semibold">{title}</h2>
                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <div className="p-3 pt-0">
                    {children}
                </div>
            </div>
        </div>
    );
};