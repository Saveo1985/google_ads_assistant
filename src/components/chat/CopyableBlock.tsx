import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableBlockProps {
    content: string;
}

export const CopyableBlock: React.FC<CopyableBlockProps> = ({ content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={handleCopy}
            className="group relative my-2 cursor-pointer rounded-md border border-gray-200 bg-white p-3 transition-all hover:border-[#B7EF02] hover:shadow-sm"
        >
            <div className="pr-8 text-sm font-medium text-gray-800 break-words font-mono">
                {content}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#B7EF02]">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </div>
            {copied && (
                <span className="absolute -top-6 right-0 text-[10px] font-bold text-green-500 uppercase tracking-wider">
                    Kopiert!
                </span>
            )}
        </div>
    );
};
