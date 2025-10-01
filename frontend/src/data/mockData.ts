import { WaterUsageData, DailyStats, MonthlyStats, NotificationStats, PeriodComparison } from '../interfaces/types';

export const waterUsageData: WaterUsageData[] = [
  
  
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
  
];

export const monthlyStats: MonthlyStats[] = [
  {
    month: 'มกราคม 2567',
    totalUsage: 30,
    maxDaily: 20,
    minDaily: 40,
    avgDaily: 22,
    daysCount: 31
  },
  {
    month: 'ธันวาคม 2566',
    totalUsage: 10,
    maxDaily: 15,
    minDaily: 11,
    avgDaily: 12,
    daysCount: 31
  },
  {
    month: 'พฤศจิกายน 2566',
    totalUsage: 20,
    maxDaily: 20,
    minDaily: 20,
    avgDaily: 20,
    daysCount: 30
  }
];

export const notificationStats: NotificationStats = {
  totalNotifications: 47,
  highUsageAlerts: 12,
  lowUsageAlerts: 8,
  lastAlert: '2024-01-17 14:30'
};

export const periodComparisons: PeriodComparison[] = [
  {
    period: 'สัปดาห์นี้',
    currentUsage: 2890,
    previousUsage: 2645,
    change: 245,
    changePercent: 9.3
  },
  {
    period: 'เดือนนี้',
    currentUsage: 12450,
    previousUsage: 11890,
    change: 560,
    changePercent: 4.7
  }
];