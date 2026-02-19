import React from 'react';
import { CopyableBlock } from './CopyableBlock';

interface FormattedMessageProps {
    text: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text }) => {
    // Regex erkennt Code-Blöcke (```content```)
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-1">
            {parts.map((part, index) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const content = part.slice(3, -3).trim();
                    return <CopyableBlock key={index} content={content} />;
                }

                // Bestehende Formatierung für den restlichen Text
                return (
                    <span key={index} className="whitespace-pre-wrap">
                        {part.split('\n').map((line, lineIndex) => (
                            <React.Fragment key={lineIndex}>
                                {line.split(/(\*\*.*?\*\*)/g).map((subPart, subIndex) => {
                                    if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                        return <strong key={subIndex}>{subPart.slice(2, -2)}</strong>;
                                    }
                                    return subPart;
                                })}
                                {lineIndex < part.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </span>
                );
            })}
        </div>
    );
};
