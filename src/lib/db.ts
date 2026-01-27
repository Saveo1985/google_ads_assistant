import { collection, doc } from 'firebase/firestore';
import { db } from './firebase';

const APP_ID = '2h_web_solutions_google_ads_asssitant_v1';

// Helper to get full path
export const getAppCollection = (subPath: string) => {
    return collection(db, `apps/${APP_ID}/${subPath}`);
};

export const getAppDoc = (subPath: string, docId: string) => {
    return doc(db, `apps/${APP_ID}/${subPath}`, docId);
};

// Types
export interface Client {
    id: string;
    name: string;
    website: string;
    industry?: string;
    description?: string;
    createdAt: any;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
