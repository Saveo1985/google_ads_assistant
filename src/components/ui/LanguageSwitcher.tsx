import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'de' ? 'en' : 'de';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors text-sm font-['Barlow']"
            title="Switch Language"
        >
            <Globe size={16} />
            <span className="uppercase font-bold">{i18n.language === 'de' ? 'DE' : 'EN'}</span>
        </button>
    );
}
