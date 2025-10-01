export interface WaterUsageData {
    id: string;
    date: string;
    period: string;
    usage: number;
    location: string;
    type: 'drinking' | 'cooking' | 'cleaning' | 'irrigation' | 'other';
}

export interface DailyStats {
    date: string;
    totalUsage: number;
    maxUsage: number;
    minUsage: number;
    avgUsage: number;
    peakPeriod: string;
    lowPeriod: string;
}

export interface MonthlyStats {
    month: string;
    totalUsage: number;
    maxDaily: number;
    minDaily: number;
    avgDaily: number;
    daysCount: number;
}

export interface NotificationStats {
    totalNotifications: number;
    readNotifications: number;
    unreadNotifications: number;
    lastAlert: string;
}

export interface PeriodComparison {
    period: string;
    currentUsage: number;
    previousUsage: number;
    change: number;
    changePercent: number;
}