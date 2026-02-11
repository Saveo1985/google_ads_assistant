export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: any;
    [key: string]: any;
}

export interface Client {
    id: string;
    name: string;
    website?: string;
    industry?: string;
    description?: string;
    googleAdsCustomerId?: string;
    audit?: {
        products?: string;
        strategy?: string;
        [key: string]: any;
    };
    unitEconomics?: any;
    lastSyncedAt?: any; // potentially Timestamp or Date or string
    [key: string]: any;
}

export interface CampaignStats {
    clicks: number | string;
    impressions: number | string;
    cost: number | string;
    conversions: number | string;
    conversionValue?: number | string;
    currency?: string;
}

export interface DailyStat {
    date: string;
    clicks: number;
    cost_micros: number;
    conversions: number;
}

export interface Campaign {
    id: string;
    name: string;
    status: string;
    stats?: CampaignStats;
    dailyStats?: DailyStat[];
    lastSyncedAt?: any;
    memory_base?: string;
    [key: string]: any;
}
