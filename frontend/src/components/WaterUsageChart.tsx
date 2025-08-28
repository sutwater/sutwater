import React from 'react';
import { WaterUsageData, DailyStats } from '../interfaces/types';

interface WaterUsageChartProps {
  data: WaterUsageData[];
  dailyStats: DailyStats[];
  selectedView: string;
}

export const WaterUsageChart: React.FC<WaterUsageChartProps> = ({
  data,
  dailyStats,
  selectedView
}) => {
  const chartData = selectedView === 'daily' ? dailyStats : data;
  const maxValue = Math.max(...chartData.map(item => 
    selectedView === 'daily' ? (item as any).totalUsage : (item as WaterUsageData).usage
  ));
  const avgValue = chartData.reduce((sum, item) => 
    sum + (selectedView === 'daily' ? (item as any).totalUsage : (item as WaterUsageData).usage), 0
  ) / chartData.length;

  const getBarHeight = (value: number) => {
    return (value / maxValue) * 200;
  };

  const getBarColor = (value: number, type?: string) => {
    if (selectedView !== 'daily' && type) {
      const colorMap = {
        drinking: 'bg-blue-500',
        cooking: 'bg-green-500',
        cleaning: 'bg-purple-500',
        irrigation: 'bg-orange-500',
        other: 'bg-gray-500'
      };
      return colorMap[type as keyof typeof colorMap] || 'bg-gray-500';
    }
    
    if (value > avgValue * 1.2) return 'bg-red-500';
    if (value < avgValue * 0.8) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          ปริมาณการใช้น้ำแต่ละอาคาร
        </h3>
        {/* <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">สูงกว่าค่าเฉลี่ย</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">ปกติ</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">ต่ำกว่าค่าเฉลี่ย</span>
          </div>
        </div> */}
      </div>

      <div className="relative">
        {/* Chart container */}
        <div className="flex items-end justify-between space-x-2 h-64 mb-4 p-4 bg-gray-50 rounded-lg overflow-x-auto">
          {chartData.map((item, index) => {
            const value = selectedView === 'daily' ? (item as any).totalUsage : (item as WaterUsageData).usage;
            const barHeight = getBarHeight(value);
            const barColor = getBarColor(value, selectedView !== 'daily' ? (item as WaterUsageData).type : undefined);
            
            return (
              <div key={index} className="flex flex-col items-center group relative">
                <div
                  className={`${barColor} rounded-t-md transition-all duration-300 hover:opacity-80 min-w-[24px]`}
                  style={{ height: `${barHeight}px` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <div className="font-medium">{value} ลิตร</div>
                    {selectedView === 'daily' ? (
                      <div className="text-gray-300">{(item as any).date}</div>
                    ) : (
                      <>
                        <div className="text-gray-300">{(item as WaterUsageData).period}</div>
                        <div className="text-gray-300 capitalize">
                          {(item as WaterUsageData).type === 'drinking' ? 'ดื่ม' :
                           (item as WaterUsageData).type === 'cooking' ? 'ทำอาหาร' :
                           (item as WaterUsageData).type === 'cleaning' ? 'ทำความสะอาด' :
                           (item as WaterUsageData).type === 'irrigation' ? 'รดน้ำต้นไม้' : 'อื่นๆ'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center max-w-[60px] truncate">
                  {selectedView === 'daily' ? 
                    new Date((item as any).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                    (item as WaterUsageData).period.split('-')[0]
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* Average line */}
        <div className="absolute left-4 right-4 pointer-events-none" style={{ bottom: `${60 + (avgValue / maxValue) * 200}px` }}>
          <div className="border-t-2 border-dashed border-amber-500 relative">
            <div className="absolute -top-6 right-0 bg-amber-500 text-white text-xs px-2 py-1 rounded">
              เฉลี่ย: {Math.round(avgValue)} ลิตร
            </div>
          </div>
        </div>
      </div>

      {/* Statistics summary */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{maxValue} ลิตร</div>
          <div className="text-sm text-gray-600">สูงสุด</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {Math.min(...chartData.map(item => 
              selectedView === 'daily' ? (item as any).totalUsage : (item as WaterUsageData).usage
            ))} ลิตร
          </div>
          <div className="text-sm text-gray-600">ต่ำสุด</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{Math.round(avgValue)} ลิตร</div>
          <div className="text-sm text-gray-600">ค่าเฉลี่ย</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {chartData.reduce((sum, item) => 
              sum + (selectedView === 'daily' ? (item as any).totalUsage : (item as WaterUsageData).usage), 0
            )} ลิตร
          </div>
          <div className="text-sm text-gray-600">รวม</div>
        </div>
      </div> */}
    </div>
  );
};