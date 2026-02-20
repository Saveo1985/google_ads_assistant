import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyTileProps {
    content: string;
}

export const CopyTile: React.FC<CopyTileProps> = ({ content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div
            className="group relative flex items-center justify-between p-3 bg-white rounded-md border border-[#B7EF02] hover:shadow-[0_0_10px_rgba(183,239,2,0.3)] transition-all cursor-pointer"
            onClick={handleCopy}
            title={copied ? "Kopiert!" : "Klicken zum Kopieren"}
        >
            <span className="text-sm text-gray-800 font-['Barlow'] pr-8 break-words whitespace-pre-wrap w-full">
                {content}
            </span>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7EF02] opacity-70 group-hover:opacity-100 transition-opacity">
                {copied ? <Check size={18} /> : <Copy size={18} />}
            </div>

            {/* Tooltip for feedback */}
            {copied && (
                <div className="absolute -top-8 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in-up">
                    Kopiert!
                </div>
            )}
        </div>
    );
};
