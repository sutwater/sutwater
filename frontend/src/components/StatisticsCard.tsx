import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Droplets,
  AlertTriangle,
  Bell,
  Calendar,
} from "lucide-react";
import { NotificationStats, PeriodComparison } from "../interfaces/types";

interface StatisticsCardsProps {
  notificationStats: NotificationStats;
  periodComparisons: PeriodComparison[];
  loading?: boolean;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  notificationStats,
  periodComparisons,
  loading = false,
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
              <p className="text-sm font-medium text-gray-600">
                การแจ้งเตือนทั้งหมด
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? "..." : notificationStats.totalNotifications}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">อ่านแล้ว</span>
            <span className="font-medium text-green-600">
              {loading ? "..." : notificationStats.readNotifications}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ยังไม่อ่าน</span>
            <span className="font-medium text-red-600">
              {loading ? "..." : notificationStats.unreadNotifications}
            </span>
          </div>
        </div>
      </div>

      {/* Period Comparisons */}
      {/* Period Comparison 1 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full">
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Droplets className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">วันนี้</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periodComparisons[0].currentUsage.toLocaleString()} ลิตร
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {periodComparisons[0].changePercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  periodComparisons[0].changePercent > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {periodComparisons[0].changePercent > 0 ? "+" : ""}
                {periodComparisons[0].changePercent}%
              </span>
              <span className="text-sm text-gray-500">vs previous</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              เปลี่ยนแปลง {periodComparisons[0].change.toLocaleString()} ลิตร
            </div>
          </div>
        </div>
      </div>

      {/* Period Comparison 2 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow h-full">
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Droplets className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">สัปดาห์นี้</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periodComparisons[1].currentUsage.toLocaleString()} ลิตร
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {periodComparisons[1].changePercent > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  periodComparisons[1].changePercent > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {periodComparisons[1].changePercent > 0 ? "+" : ""}
                {periodComparisons[1].changePercent}%
              </span>
              <span className="text-sm text-gray-500">vs previous</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              เปลี่ยนแปลง {periodComparisons[1].change.toLocaleString()} ลิตร
            </div>
          </div>
        </div>
      </div>

      {/* Last Alert */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              การแจ้งเตือนล่าสุด
            </p>
            <p className="text-lg font-bold text-gray-900">
              {loading
                ? "..."
                : notificationStats.lastAlert
                ? new Date(notificationStats.lastAlert).toLocaleDateString(
                    "th-TH"
                  )
                : "ไม่มีข้อมูล"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {loading
              ? "..."
              : notificationStats.lastAlert
              ? new Date(notificationStats.lastAlert).toLocaleTimeString(
                  "th-TH"
                )
              : "ไม่มีข้อมูล"}
          </span>
        </div>
      </div>
    </div>
  );
};
