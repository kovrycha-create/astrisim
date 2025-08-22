import React, { useState, useEffect } from 'react';
import { OracleIcon } from './Icons';

interface AICommentatorPanelProps {
    commentary: string;
    isThinking: boolean;
}

const TypingEffect: React.FC<{ text: string }> = ({ text }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            return;
        }

        let i = 0;
        setDisplayedText(''); // Reset on new text

        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(intervalId);
            }
        }, 25); // Typing speed in ms

        return () => clearInterval(intervalId);
    }, [text]);

    return <p className="text-gray-200 text-lg font-mono whitespace-pre-wrap">{displayedText}<span className="animate-pulse">_</span></p>;
};

export const AICommentatorPanel: React.FC<AICommentatorPanelProps> = ({ commentary, isThinking }) => {
    return (
        <div className="h-full bg-gray-900/90 backdrop-blur-xl text-white w-full shadow-2xl overflow-hidden animate-fade-in border-2 border-purple-600/30 rounded-lg p-4 flex gap-4">
            <div className="flex-shrink-0 flex flex-col items-center">
                <OracleIcon className="w-12 h-12 text-purple-400" />
                <span className="text-xs font-bold text-purple-400 tracking-widest mt-1">ORACLE</span>
            </div>
            <div className="flex-grow min-w-0">
                {isThinking && !commentary ? (
                    <div className="flex items-center h-full">
                        <div className="flex items-center gap-2 text-gray-400">
                           <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-400"></div>
                           <span>The Oracle is observing the strands...</span>
                        </div>
                    </div>
                ) : (
                    <TypingEffect text={commentary} />
                )}
            </div>
        </div>
    );
};
