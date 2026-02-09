import { collection, doc } from 'firebase/firestore';
import { db } from './firebase';

export const APP_ID = '2h_web_solutions_google_ads_asssitant_v1';

// Helper to get full path
export const getAppCollection = (subPath: string) => {
    return collection(db, `apps/${APP_ID}/${subPath}`);
};

export const getAppDoc = (subPath: string, docId: string) => {
    return doc(db, `apps/${APP_ID}/${subPath}`, docId);
};

// Types
export interface UnitEconomics { // @deprecated: Use ServiceLineEconomics
    aov: number;
    targetRoas: number;
    taxRate: number;
    returnRate: number;
    cogs: number;
    fulfillmentCost: number;
}

export interface ServiceLineEconomics {
    id: string;           // UUID or Timestamp
    name: string;         // e.g. "Lasertag", "Pixel Games"
    currency: string;     // e.g. "EUR"
    aov: number;          // Average Order Value
    targetRoas: number;   // Target ROAS
    taxRate: number;      // Tax Rate %
    returnRate: number;   // Return Rate %
    cogs: number;         // COGS %
    fulfillmentCost: number; // Absolute value
}

export interface Client {
    id: string;
    name: string;
    website: string;
    industry?: string;
    description?: string;
    /** @deprecated Use serviceLines instead */
    unitEconomics?: UnitEconomics;
    serviceLines?: ServiceLineEconomics[];
    createdAt: any;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
