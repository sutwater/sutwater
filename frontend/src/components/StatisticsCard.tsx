import React from 'react';
import { TrendingUp, TrendingDown, Droplets, AlertTriangle, Bell, Calendar } from 'lucide-react';
import { NotificationStats, PeriodComparison } from '../interfaces/types';

interface StatisticsCardsProps {
  notificationStats: NotificationStats;
  periodComparisons: PeriodComparison[];
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  notificationStats,
  periodComparisons
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">การแจ้งเตือนทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{notificationStats.totalNotifications}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">การใช้สูง</span>
            <span className="font-medium text-orange-600">{notificationStats.highUsageAlerts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ความดันต่ำ</span>
            <span className="font-medium text-red-600">{notificationStats.lowPressureAlerts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">การบำรุงรักษา</span>
            <span className="font-medium text-yellow-600">{notificationStats.maintenanceAlerts}</span>
          </div>
        </div>
      </div>

      {/* Period Comparisons */}
      {periodComparisons.map((comparison, index) => (
        <div key={comparison.period} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                index === 0 ? 'bg-teal-100' : index === 1 ? 'bg-purple-100' : 'bg-indigo-100'
              }`}>
                <Droplets className={`h-5 w-5 ${
                  index === 0 ? 'text-teal-600' : index === 1 ? 'text-purple-600' : 'text-indigo-600'
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{comparison.period}</p>
                <p className="text-2xl font-bold text-gray-900">{comparison.currentUsage.toLocaleString()} ลิตร</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {comparison.changePercent > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            <span className={`text-sm font-medium ${
              comparison.changePercent > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent}%
            </span>
            <span className="text-sm text-gray-500">vs previous</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            เปลี่ยนแปลง {comparison.changePercent > 0 ? '+' : ''}{comparison.change.toLocaleString()} ลิตร
          </div>
        </div>
      ))}

      {/* Last Alert */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">การแจ้งเตือนล่าสุด</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(notificationStats.lastAlert).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{new Date(notificationStats.lastAlert).toLocaleTimeString('th-TH')}</span>
        </div>
      </div>
    </div>
  );
};