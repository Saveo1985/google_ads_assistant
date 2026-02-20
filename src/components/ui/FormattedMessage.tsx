import React from 'react';
import { CopyTile } from './CopyTile';

interface FormattedMessageProps {
    text: string;
    isUser: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser }) => {
    if (!text) return null;

    // Split based on custom copy blocks
    // Pattern captures content inside <copy_block>...</copy_block>
    const parts = text.split(/(<copy_block>[\s\S]*?<\/copy_block>)/g);

    return (
        <div className="space-y-3 text-sm leading-relaxed">
            {parts.map((part, index) => {
                // CASE 1: COPY BLOCK
                if (part.startsWith('<copy_block>')) {
                    // Extract inner content and split by <item>
                    const content = part.replace(/<\/?copy_block>/g, '');
                    const items = content.match(/<item>([\s\S]*?)<\/item>/g);

                    if (items) {
                        return (
                            <div key={index} className="space-y-2 my-2">
                                {items.map((item, idx) => {
                                    const cleanText = item.replace(/<\/?item>/g, '').trim();
                                    return <CopyTile key={idx} content={cleanText} />;
                                })}
                            </div>
                        );
                    }
                    return null;
                }

                // CASE 2: REGULAR TEXT (Markdown-like formatting)
                return part.split('\n').map((line, i) => {
                    if (!line.trim()) return <div key={i} className="h-2" />; // Graceful spacing

                    // Identify list items for indentation
                    const isList = /^\d+\.|^[\*-]/.test(line.trim());
                    // Parse **Bold** text
                    const boldParts = line.split(/(\*\*.*?\*\*)/g);

                    return (
                        <div key={`${index}-${i}`} className={`${isList ? 'pl-4' : ''} min-h-[1.25rem]`}>
                            {boldParts.map((boldPart, j) => {
                                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                                    return (
                                        <strong
                                            key={j}
                                            className={isUser ? "font-bold text-white" : "font-bold text-gray-900"}
                                        >
                                            {boldPart.slice(2, -2)}
                                        </strong>
                                    );
                                }
                                return <span key={j}>{boldPart}</span>;
                            })}
                        </div>
                    );
                });
            })}
        </div>
    );
};
