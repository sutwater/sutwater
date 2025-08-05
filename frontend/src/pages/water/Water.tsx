import { useState } from 'react';
import { Droplets, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { StatisticsCards } from '../../components/StatisticsCard';
import { TimeFilter } from '../../components/TimeFilter';
import { WaterUsageChart } from '../../components/WaterUsageChart';
import { WaterUsageTable } from '../../components/WaterUsageTable';
import {
    waterUsageData,
    dailyStats,
    monthlyStats,
    notificationStats,
    periodComparisons,
} from '../../data/mockData';

const Water = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('สัปดาห์');
    const [selectedView, setSelectedView] = useState('ชั่วโมง');

    return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Droplets className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">แดชบอร์ด</h1>
                  <p className="text-sm text-gray-500">ระบบการใช้น้ำ</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                
              </div>
              <div className="text-sm text-gray-500">
                อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <StatisticsCards 
          notificationStats={notificationStats}
          periodComparisons={periodComparisons}
        />

        {/* Time Filter */}
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedView={selectedView}
          onViewChange={setSelectedView}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Usage Chart */}
          <div className="lg:col-span-2">
            <WaterUsageChart 
              data={waterUsageData}
              dailyStats={dailyStats}
              selectedView={selectedView}
            />
          </div>

          {/* Period Analysis */}
          <div className="space-y-6">
            {/* Daily Peak Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">ช่วงเวลาใช้น้ำสูงสุด</h3>
              </div>
              <div className="space-y-3">
                {['15:00-18:00', '09:00-12:00', '18:00-21:00'].map((period, index) => (
                  <div key={period} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{period}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-12 h-2 rounded-full ${
                        index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {index === 0 ? '155 ลิตร' : index === 1 ? '76 ลิตร' : '85 ลิตร'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Comparison */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">แนวโน้มรายเดือน</h3>
              </div>
              <div className="space-y-4">
                {monthlyStats.map((month) => (
                  <div key={month.month} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {month.month.split(' ')[0]}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {month.totalUsage.toLocaleString()} ลิตร
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      เฉลี่ย: {Math.round(month.avgDaily)} ลิตร/วัน
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>สูงสุด: {month.maxDaily} ลิตร</span>
                      <span>ต่ำสุด: {month.minDaily} ลิตร</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage by Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">การใช้ตามประเภท</h3>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'รดน้ำต้นไม้', usage: 466, color: 'bg-orange-500' },
                  { type: 'ทำความสะอาด', usage: 320, color: 'bg-purple-500' },
                  { type: 'ทำอาหาร', usage: 138, color: 'bg-green-500' },
                  { type: 'ดื่ม', usage: 112, color: 'bg-blue-500' }
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-gray-600">{item.type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.usage} ลิตร</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Water Usage Table */}
        <WaterUsageTable data={waterUsageData} />
      </main>
    </div>
  );
};

export default Water;
