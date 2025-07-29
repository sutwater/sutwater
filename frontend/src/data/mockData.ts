import { WaterUsageData, DailyStats, MonthlyStats, NotificationStats, PeriodComparison } from '../interfaces/types';

export const waterUsageData: WaterUsageData[] = [
    { id: '1', date: '2024-01-15', period: '06:00-09:00', usage: 45, location: 'Kitchen', type: 'cooking' },
    { id: '2', date: '2024-01-15', period: '09:00-12:00', usage: 78, location: 'Bathroom', type: 'cleaning' },
    { id: '3', date: '2024-01-15', period: '12:00-15:00', usage: 23, location: 'Kitchen', type: 'drinking' },
    { id: '4', date: '2024-01-15', period: '15:00-18:00', usage: 156, location: 'Garden', type: 'irrigation' },
    { id: '5', date: '2024-01-15', period: '18:00-21:00', usage: 89, location: 'Bathroom', type: 'cleaning' },
    { id: '6', date: '2024-01-15', period: '21:00-00:00', usage: 34, location: 'Kitchen', type: 'drinking' },
    { id: '7', date: '2024-01-16', period: '06:00-09:00', usage: 52, location: 'Kitchen', type: 'cooking' },
    { id: '8', date: '2024-01-16', period: '09:00-12:00', usage: 67, location: 'Bathroom', type: 'cleaning' },
    { id: '9', date: '2024-01-16', period: '12:00-15:00', usage: 29, location: 'Kitchen', type: 'drinking' },
    { id: '10', date: '2024-01-16', period: '15:00-18:00', usage: 143, location: 'Garden', type: 'irrigation' },
    { id: '11', date: '2024-01-16', period: '18:00-21:00', usage: 92, location: 'Bathroom', type: 'cleaning' },
    { id: '12', date: '2024-01-16', period: '21:00-00:00', usage: 28, location: 'Kitchen', type: 'drinking' },
    { id: '13', date: '2024-01-17', period: '06:00-09:00', usage: 41, location: 'Kitchen', type: 'cooking' },
    { id: '14', date: '2024-01-17', period: '09:00-12:00', usage: 85, location: 'Bathroom', type: 'cleaning' },
    { id: '15', date: '2024-01-17', period: '12:00-15:00', usage: 31, location: 'Kitchen', type: 'drinking' },
    { id: '16', date: '2024-01-17', period: '15:00-18:00', usage: 167, location: 'Garden', type: 'irrigation' },
    { id: '17', date: '2024-01-17', period: '18:00-21:00', usage: 76, location: 'Bathroom', type: 'cleaning' },
    { id: '18', date: '2024-01-17', period: '21:00-00:00', usage: 22, location: 'Kitchen', type: 'drinking' },
];

export const dailyStats: DailyStats[] = [
    {
        date: '2024-01-15',
        totalUsage: 425,
        maxUsage: 156,
        minUsage: 23,
        avgUsage: 70.8,
        peakPeriod: '15:00-18:00',
        lowPeriod: '12:00-15:00'
    },
    {
        date: '2024-01-16',
        totalUsage: 411,
        maxUsage: 143,
        minUsage: 28,
        avgUsage: 68.5,
        peakPeriod: '15:00-18:00',
        lowPeriod: '21:00-00:00'
    },
    {
        date: '2024-01-17',
        totalUsage: 422,
        maxUsage: 167,
        minUsage: 22,
        avgUsage: 70.3,
        peakPeriod: '15:00-18:00',
        lowPeriod: '21:00-00:00'
    }
];

export const monthlyStats: MonthlyStats[] = [
    {
        month: 'January 2024',
        totalUsage: 12450,
        maxDaily: 467,
        minDaily: 298,
        avgDaily: 401.6,
        daysCount: 31
    },
    {
        month: 'December 2023',
        totalUsage: 11890,
        maxDaily: 445,
        minDaily: 312,
        avgDaily: 383.5,
        daysCount: 31
    },
    {
        month: 'November 2023',
        totalUsage: 11234,
        maxDaily: 423,
        minDaily: 287,
        avgDaily: 374.5,
        daysCount: 30
    }
];

export const notificationStats: NotificationStats = {
    totalNotifications: 47,
    highUsageAlerts: 12,
    lowPressureAlerts: 8,
    maintenanceAlerts: 3,
    lastAlert: '2024-01-17 14:30'
};

export const periodComparisons: PeriodComparison[] = [
    {
        period: 'This Week',
        currentUsage: 2890,
        previousUsage: 2645,
        change: 245,
        changePercent: 9.3
    },
    {
        period: 'This Month',
        currentUsage: 12450,
        previousUsage: 11890,
        change: 560,
        changePercent: 4.7
    },
    {
        period: 'Last 3 Months',
        currentUsage: 35574,
        previousUsage: 33912,
        change: 1662,
        changePercent: 4.9
    }
];