import React from 'react';
import { CopyTile } from './CopyTile';
import { BarChart3, CheckCircle, Lightbulb } from 'lucide-react';

interface FormattedMessageProps {
    text: string;
    isUser: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser }) => {
    if (!text) return null;

    // Split based on custom copy blocks
    // Pattern captures content inside <copy_block>...</copy_block>
    const parts = text.split(/(<copy_block>[\s\S]*?<\/copy_block>)/g);

    // REGEX for matching Insight/Data/Action blocks
    const ANALYSIS_REGEX = /((?:\*\*Insight\*\*?:?|Insight:)\s*[\s\S]+?(?:\*\*Data\*\*?:?|Data:)\s*[\s\S]+?(?:\*\*Action\*\*?:?|Action:)\s*[\s\S]+?(?=\n\n(?:(?!\*\*Action)|\*)|$))/gi;

    // Helper for rendering regular markdown text
    const renderMarkdownText = (textChunk: string, keyPrefix: string) => {
        return textChunk.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={`${keyPrefix}-empty-${i}`} className="h-2" />; // Graceful spacing

            // Identify list items for indentation
            const isList = /^\d+\.|^[\*-]/.test(line.trim());
            // Parse **Bold** text
            const boldParts = line.split(/(\*\*.*?\*\*)/g);

            return (
                <div key={`${keyPrefix}-${i}`} className={`${isList ? 'pl-4' : ''} min-h-[1.5rem]`}>
                    {boldParts.map((boldPart, j) => {
                        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                            return (
                                <strong
                                    key={`${keyPrefix}-${i}-${j}`}
                                    className={isUser ? "font-bold text-white" : "font-bold text-gray-900"}
                                >
                                    {boldPart.slice(2, -2)}
                                </strong>
                            );
                        }
                        return <span key={`${keyPrefix}-${i}-${j}`}>{boldPart}</span>;
                    })}
                </div>
            );
        });
    };

    return (
        <div className="space-y-4 text-sm leading-relaxed font-['Barlow']">
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
                                    const rawText = item.replace(/<\/?item>/g, '').trim();

                                    let label = undefined;
                                    let content = rawText;

                                    // Detect metadata prefixes like "Headline 1:", "Beschreibung:"
                                    const match = rawText.match(/^([^:]{2,35}):\s*(.+)/);
                                    if (match) {
                                        const possibleLabel = match[1].trim();
                                        const isMetadataLabel = /headline|titel|desc|beschreibung|sitelink|callout|cta|text|asset|zusatzinfo|snippet/i.test(possibleLabel);

                                        if (isMetadataLabel) {
                                            label = possibleLabel;
                                            content = match[2].trim();
                                        }
                                    }

                                    return <CopyTile key={idx} label={label} content={content} />;
                                })}
                            </div>
                        );
                    }
                    return null;
                }

                // CASE 2: REGULAR TEXT / ANALYSIS BLOCK
                const subParts = part.split(ANALYSIS_REGEX);

                return subParts.map((subPart, subIdx) => {
                    if (!subPart) return null;

                    // Match Analysis Block precisely
                    if (/^(?:\*\*Insight\*\*?:?|Insight:)\s*[\s\S]+?(?:\*\*Data\*\*?:?|Data:)\s*[\s\S]+?(?:\*\*Action\*\*?:?|Action:)/i.test(subPart)) {
                        const insightMatch = subPart.match(/(?:\*\*Insight\*\*?:?|Insight:)\s*([\s\S]*?)(?=\*\*Data\*\*?:?|Data:)/i);
                        const dataMatch = subPart.match(/(?:\*\*Data\*\*?:?|Data:)\s*([\s\S]*?)(?=\*\*Action\*\*?:?|Action:)/i);
                        const actionMatch = subPart.match(/(?:\*\*Action\*\*?:?|Action:)\s*([\s\S]*?)$/i);

                        const insightText = insightMatch ? insightMatch[1].trim() : '';
                        const dataText = dataMatch ? dataMatch[1].trim() : '';
                        const actionText = actionMatch ? actionMatch[1].trim() : '';

                        return (
                            <div key={`analysis-${index}-${subIdx}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden my-5 flex flex-col">
                                {/* Insight Section */}
                                <div className="border-l-4 border-[#B7EF02] p-4 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-slate-800 font-['Federo'] font-semibold tracking-wide">
                                        <Lightbulb size={18} className="text-[#B7EF02]" />
                                        <span>INSIGHT</span>
                                    </div>
                                    <div className="text-slate-700">
                                        {renderMarkdownText(insightText, `insight-${index}-${subIdx}`)}
                                    </div>
                                </div>

                                {/* Data Section */}
                                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-slate-800 font-['Federo'] font-semibold tracking-wide">
                                        <BarChart3 size={18} className="text-slate-500" />
                                        <span>DATA</span>
                                    </div>
                                    <div className="text-slate-700">
                                        {renderMarkdownText(dataText, `data-${index}-${subIdx}`)}
                                    </div>
                                </div>

                                {/* Action Section */}
                                <div className="bg-emerald-50/50 p-4 border-t border-emerald-100 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-emerald-800 font-['Federo'] font-semibold tracking-wide">
                                        <CheckCircle size={18} className="text-emerald-500" />
                                        <span>ACTION</span>
                                    </div>
                                    <div className="text-emerald-900">
                                        {renderMarkdownText(actionText, `action-${index}-${subIdx}`)}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Standard text
                    return (
                        <div key={`text-${index}-${subIdx}`}>
                            {renderMarkdownText(subPart, `text-${index}-${subIdx}`)}
                        </div>
                    );
                });
            })}
        </div>
    );
};
